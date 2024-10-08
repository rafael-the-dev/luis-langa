import moment from "moment"

import InvalidArgumentError from "@/errors/server/InvalidArgumentError";
import { dateFormat } from "./date";
import { StockClientRequestBodyType, StockClientRequestItemType } from "@/types/stock";
import currency from "currency.js";
import { WarehouseType } from "@/types/warehouse";
import { ProductType, WarehouseProductType } from "@/types/product";
import { MongoDbConfigType } from "@/types/mongoDb";

export const isLessOrEqualToZero = (value: number | string) => currency(value).value <= 0;

export const isValidDate = (date: moment.Moment) => {
    const currentDate = moment(Date.now());
    currentDate.add(1, 'day');

    const formattedCurrentDate = currentDate.format(dateFormat);

    if(formattedCurrentDate === date.format(dateFormat)) {
        throw new InvalidArgumentError(`Invalid date, date must not be greater than or equal to ${formattedCurrentDate}`);
    }

    return true;
}

export const isValidPrice = (stockDetails: StockClientRequestBodyType) => {
    const total = stockDetails.items.reduce((prevValue, currentItem) => {
        if(isLessOrEqualToZero(currentItem.quantity))
            throw new InvalidArgumentError("Quantity must not be less than or equal to zero");

        const { product } = currentItem;

        const currentItemTotal = currency(currentItem.quantity).multiply(product.purchasePrice).value;

        if(currentItem.total !== currentItemTotal) 
            throw new InvalidArgumentError(`Item's total price does not match with product's purchasePrice multiplied by item's quantity`);

        if(product.purchasePrice >= product.sellPrice)
            throw new InvalidArgumentError("Purchase price must not be greater than or equal to sell price");

        return currency(prevValue).add(currentItem.total).value;
    }, 0);

    if(total !== stockDetails.total)
        throw new InvalidArgumentError("Cart's total is not equal to sum of all cart items");

    return true;
};

export const validateAndGetTotalPrice = (items: StockClientRequestItemType[]) => {
    const total = items.reduce((prevValue, currentItem) => {
        if(isLessOrEqualToZero(currentItem.quantity))
            throw new InvalidArgumentError("Quantity must not be less than or equal to zero");

        const { product } = currentItem;

        const currentItemTotal = currency(currentItem.quantity).multiply(product.purchasePrice).value;

        if(currentItem.total !== currentItemTotal) 
            throw new InvalidArgumentError(`Item's total price does not match with product's purchasePrice multiplied by item's quantity`);

        if(product.purchasePrice >= product.sellPrice)
            throw new InvalidArgumentError("Purchase price must not be greater than or equal to sell price");

        return currency(prevValue).add(currentItem.total).value;
    }, 0);

    return total
}

export const isValidReference = (storeDetails: WarehouseType, value: string) => {
    if(!value || !Boolean(value?.trim())) {
        throw new InvalidArgumentError("Invalid reference")
    }

    return true;
}

export const updateProduct = (productProxy: WarehouseProductType, storeId: string, mongoDbConfig: MongoDbConfigType) => {
    return mongoDbConfig
            .collections
            .WAREHOUSES
            .updateOne(
                { id: storeId, "products.id": productProxy.id },
                { 
                    $set: {
                        "products.$[product].profit": productProxy.profit,
                        "products.$[product].purchasePrice": productProxy.purchasePrice,
                        "products.$[product].sellPrice": productProxy.sellPrice,
                        "products.$[product].stock.quantity": productProxy.stock.quantity,
                    }
                },
                {
                    arrayFilters: [
                        { "product.id": productProxy.id }
                    ]
                }
            )
    }