import currency from "currency.js";

import { ConfigType } from "@/types/app-config-server";
import { CartResquestType, RequestCartItem } from "@/types/cart";
import { StoreProductType, WarehouseProductType } from "@/types/product";
import { SaleType, SaleInfoType, SaleItemType, SaleDebtType } from "@/types/sale";

import { toISOString } from "@/helpers/date";
import { getId } from "@/helpers/id";
import { isInvalidNumber } from "@/helpers/validation";
import { getProduct, isValidCartItemTotalPrice, updateSale } from "@/helpers/sales";
import { sort } from "@/helpers/sort";
import { getProducts, updateProduct } from "@/helpers/products";
import getProductProxy from "../../proxy/product";
import getSaleProxy from "../../proxy/sale";

import Error404 from "@/errors/server/404Error";
import InvalidArgumentError from "@/errors/server/InvalidArgumentError";

import Customers from "../Customer";


class Sale {
    static async getAll({ filters,  storeId }: { filters?: Object, storeId: string }, { mongoDbConfig, user }: ConfigType) {
        const list = await mongoDbConfig
            .collections
            .WAREHOUSES
            .aggregate([
                { $match: { id: storeId } },
                { $unwind: "$unpaid-sales" },
                { $match: { ...(filters ?? {} ) } },
                { $unwind: "$unpaid-sales.items" },
                {
                    $lookup: {
                        from: "products", // Replace with the name of your external product collection
                        localField: "unpaid-sales.items.product.id",
                        foreignField: "id",
                        as: "product_info"
                    }
                },
                { $unwind: "$product_info" },
                {
                    $lookup: {
                        from: "clients", // Replace with the name of your external product collection
                        localField: "unpaid-sales.customer",
                        foreignField: "id",
                        as: "customer_info"
                    }
                },
                {
                    $lookup: {
                        from: "users", // Replace with the name of your external product collection
                        localField: "unpaid-sales.createdBy",
                        foreignField: "username",
                        as: "user_info"
                    }
                },
                { $unwind: "$user_info" },
                {
                    $addFields: {
                        "unpaid-sales.items.product": {
                        item: "$product_info", // Embed product info into sales document
                        // price: 
                        }
                    }
                },
                {
                    $group: {
                        _id: "$unpaid-sales.id",
                        createdAt: { $first: "$unpaid-sales.createdAt" },
                        changes: { $first: "$unpaid-sales.changes" },
                        customer: { 
                            $first: {
                                firstName: "$customer_info.firstName",
                                lastName: "$customer_info.lastName",
                                username: "$customer_info.username"
                            }
                        },
                        id: { $first: "$unpaid-sales.id" },
                        items: {
                            $push: {
                                quantity: "$unpaid-sales.items.quantity",
                                total: "$unpaid-sales.items.total",
                                product: {
                                    barcode: "$product_info.barcode",
                                    category: "$product_info.category",
                                    id: "$unpaid-sales.items.product.id",
                                    name: "$product_info.name",
                                    sellPrice: "$unpaid-sales.items.product.price",
                                }
                            }
                        },
                        profit: { $first: "$unpaid-sales.profit" },
                        paymentMethods: { $first: "$unpaid-sales.paymentMethods" },
                        remainingAmount: { $first: "$unpaid-sales.remainingAmount" },
                        total: { $first: "$unpaid-sales.total" },
                        totalReceived: { $first: "$unpaid-sales.totalReceived" },
                        user: { 
                            $first: {
                                firstName: "$user_info.firstName",
                                lastName: "$user_info.lastName",
                                username: "$user_info.username"
                            }
                        }
                    }
                }
            ])
            .toArray() as SaleInfoType[];
        
        sort(list);
        
        return { 
            data: list
        };
    }

    static async register(debt: SaleDebtType, { mongoDbConfig, user }: ConfigType) {
        const { storeId } = user.stores[0]
        const saleId = getId()

        if(!debt || typeof debt !== "object") throw new InvalidArgumentError("Invalid debt details");

        await Customers.get(
            {
                filters: {
                    "clients.id": debt.customer
                },
                tableName: "CUSTOMERS"
            },
            {
                mongoDbConfig,
                user
            }
        )

        const productsIds = debt.items.map(item => item.product.id)

        const products = await getProducts(
            {
                filter: {
                    stores: storeId,
                    id: { $in: productsIds }
                }
            },
            { 
                mongoDbConfig, 
                user
            }
        )

        const productsClone = structuredClone(products)
        
        const productsMapper = new Map<string, StoreProductType>();

        productsClone.forEach(product => {
            if(productsIds.includes(product.id)) {
                productsMapper.set(product.id, product)
            }
        });
        
        const itemsList: SaleItemType[] = [];
        const cartItemssMapper = new Map<string, RequestCartItem>();
        let totalProfit = 0;

        // sum all quantity values, then throws an InvalidArgumentError if quantity is invalid
        const totalPrice =  debt.items.reduce((prevValue, currentItem) => {
            //check if current item quantity value is valid, then throws an error if not
            if(isInvalidNumber(currentItem.quantity)) {
                throw new InvalidArgumentError("Quantity must not be less than or equal to zero");
            }

            const currentProduct = getProduct(productsMapper, currentItem.product.id);

            if(currentItem.quantity > currentProduct.stock.quantity) {
                throw new InvalidArgumentError(`Quantity is greater than available stock`);
            }

            isValidCartItemTotalPrice(currentItem, currentProduct);

            const item = {
                ...currentItem,
                id: currentItem.product.id,
                product: {
                    id: currentItem.product.id,
                    price: currentProduct.sellPrice
                }
            };

            //sum profit
            totalProfit = currency(totalProfit).add(currency(currentProduct.profit).multiply(currentItem.quantity).value).value;
            itemsList.push(item);
            cartItemssMapper.set(currentProduct.id, currentItem);

            const price = currency(currentProduct.sellPrice).multiply(currentItem.quantity);
            return currency(prevValue).add(price).value;
        }, 0);

        if(debt.total !== totalPrice) {
            throw new InvalidArgumentError("Total price is not correct.")
        }

        try {

            let unpaidSale: SaleDebtType = {
                changes: 0,
                createdAt: toISOString(Date.now()),
                createdBy: user.username,
                customer: debt.customer,
                dueDate: debt.dueDate,
                id: saleId,
                items: itemsList,
                latePaymentFine: debt.latePaymentFine,
                profit: totalProfit,
                paymentMethods: debt.paymentMethods ?? [],
                remainingAmount: totalPrice,
                total: totalPrice,
                totalReceived: debt.totalReceived ?? 0,
            };
    
            await mongoDbConfig
                .collections
                .WAREHOUSES
                .updateOne(
                    { id: storeId }, 
                    { 
                        $push: { 
                            "unpaid-sales": unpaidSale
                        }
                    }
                );

            await Promise.all(
                debt.items.map(item => {
                    const mappedCartItem = cartItemssMapper.get(item.product.id);
                    const productInfo = productsMapper.get(item.product.id)

                    const productProxy = getProductProxy(productInfo)
                    
                    productProxy.stock.quantity = currency(productInfo.stock.quantity).subtract(mappedCartItem.quantity).value;

                    return updateProduct(productInfo, storeId, { mongoDbConfig, user })
                })
            )
        } catch(e) {
            await Promise.all([
                mongoDbConfig
                    .collections
                    .WAREHOUSES
                    .updateOne(
                        { id: storeId }, 
                        { 
                            $pull: { 
                                "unpaid-sales": {
                                    id: saleId
                                }
                            }
                        }
                    ),
                ...structuredClone(products).map(product => {
                    return updateProduct(product, storeId, { mongoDbConfig, user })
                })
            ])

            throw e;
        }
    }

    static async update({ cart, storeId }: { cart: CartResquestType, storeId: string }, { mongoDbConfig, user }: ConfigType) {
        const salesList = await this.getAll(
            {
                filters: {
                    "unpaid-sales.id": cart.id
                },
                storeId
            },
            {
                mongoDbConfig,
                user
            }
        )

        if(salesList.data.length === 0) throw new Error404("Sale details not found");

        const sale = structuredClone(salesList[0])

        const productsIds = cart.items.map(item => item.product.id)

        const productsList = await getProducts(
            {
                filter: {
                    stores: storeId,
                    id: { $in: productsIds }
                }
            }, 
            { 
                mongoDbConfig, 
                user 
            }
        )

        //const store = await Store.get({ id: storeId }, { mongoDbConfig, user })
        //const { sales } = store;

        //const salesClone = structuredClone(sales);
        const productsClone = structuredClone(productsList);

        //const selectedProducts = productsClone.filter(product => productsIds.includes(product.id));
        
        const itemsList: SaleItemType[] = [];
        const cartItemssMapper = new Map<string, RequestCartItem>();
        let totalProfit = 0;

        //const saleItemsMapper = new Map<string, SaleInfoItemType>()

        // sum all quantity values, then throws an InvalidArgumentError if quantity is invalid
        const totalPrice =  cart.items.reduce((prevValue, currentItem) => {
            //check if current item quantity value is valid, then throws an error if not
            if(isInvalidNumber(currentItem.quantity)) {
                throw new InvalidArgumentError("Quantity must not be less than or equal to zero");
            }

            const currentProduct = productsClone.find(product => currentItem.product.id === product.id);

            if(!currentProduct) throw new Error404(`Product with '${currentItem.product.id}' id not found`);

            const item = {
                ...currentItem,
                id: currentItem.product.id,
                product: {
                    id: currentItem.product.id,
                    price: currentProduct.sellPrice
                }
            };

            //sum profit
            totalProfit = currency(totalProfit).add(currency(currentProduct.profit).multiply(currentItem.quantity)).value;
            itemsList.push(item);
            cartItemssMapper.set(currentProduct.id, currentItem);

            const price = currency(currentProduct.sellPrice).multiply(currentItem.quantity);
            return currency(prevValue).add(price).value;
        }, 0);

        const saleProxy = getSaleProxy(sale, cart)

        try {

            saleProxy.total = totalPrice
            saleProxy.totalReceived = cart.totalReceived
            saleProxy.profit = totalProfit
            saleProxy.changes = currency(sale.totalReceived).subtract(sale.total).value;

            productsClone.forEach(product => {
                const productProxy = getProductProxy(product)

                const mappedCartItem = cartItemssMapper.get(product.id);
                const saleItem = sale.items.find(item => item.product.id === product.id);  

                const difference = currency(saleItem.quantity).subtract(mappedCartItem.quantity).value;
                saleItem.quantity = currency(saleItem.quantity).subtract(difference).value;
                saleItem.total = currency(saleItem.quantity).multiply(saleItem.product.price).value;

                productProxy.stock.quantity = currency(product.stock.quantity).add(difference).value
            })
    
            await updateSale(saleProxy, storeId, mongoDbConfig);

            await Promise.all(
                productsClone.map(product => {
                    return updateProduct(getProductProxy(product), storeId, { mongoDbConfig, user })
                })
            )
        } catch(e) {
            await Promise.all(
                [ 
                    updateSale(salesList[0], storeId, mongoDbConfig),
                    ...structuredClone(productsList).map(product => {
                        return updateProduct(getProductProxy(product), storeId, { mongoDbConfig, user })
                    })
                ]
            )

            throw e;
        }
    }
}

export default Sale