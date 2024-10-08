import currency from "currency.js"

import { 
    CarType,
    ExpirableProductType,
    FurnictureType,
    PRODUCTS_CATEGORIES,
    StoreProductType 
} from "@/types/product"

import { validate } from "@/validation"
import { isValidBestBefore, isValidCategory, isValidColor, isValidManufactureDate, isValidName, isValidPurchasePrice, isValidQuantity, isValidSellPrice } from "@/validation/product"
import { isValidMake, isValidModel, isValidTransmission, isValidYear } from "@/validation/product/car"
import { isValidDimesions, isValidMaterial } from "@/validation/product/furniture"

import InvalidArgumentError from "@/errors/server/InvalidArgumentError"
type PropType = "barcode" | "car" | "category" | "expirable" | "furnicture" | "name" | "profit" | "purchasePrice" | "quantity" | "stock" | "sellPrice"

const isLessThanZero = (newValue: string | number, errorMessage: string) => {
    const value = currency(newValue as number).value

    if(value < 0) throw new InvalidArgumentError(errorMessage);

    return false 
}

const testCategory = (category: PRODUCTS_CATEGORIES, product: StoreProductType) => {
    if(product.category !== category) {
        throw new InvalidArgumentError(`You cannot set value to ${category} using ${product.category} category`)
    }
}

const getProductProxy = (target: StoreProductType) => {

    const proxyHandler = {
        get(target: StoreProductType, prop: PropType, receiver) {
            const value = Reflect.get(target, prop, receiver);

            if (typeof value === 'object' && value !== null) {
                return new Proxy(value, this); // Return a proxy for nested objects
            }

            return value;
        },
        set(obj: StoreProductType, prop: PropType, newValue: any) {
            switch(prop) {
                case "barcode": {
                    const barcode = newValue as string;

                    validate(barcode, "Invalid barcode", (value: string) => Boolean(value.trim()));

                    return Reflect.set(obj, prop, barcode);
                }
                case "car": {
                    if(typeof newValue !== "object" || !newValue) return Reflect.set(obj, prop, null);

                    testCategory(PRODUCTS_CATEGORIES.CARS, obj)
                    
                    const carDetails = newValue as CarType;

                    validate(carDetails.color, "Invalid color name", isValidColor);
                    validate(carDetails.make, "Invalid make", isValidMake);
                    validate(carDetails.model, "Invalid model", isValidModel);
                    validate(carDetails.transmission, "Invalid transmission", isValidTransmission);
                    validate(carDetails.year.toString(), "Invalid year", isValidYear);
                    
                    return Reflect.set(obj, prop, carDetails);
                }
                case "category": {
                    const category = newValue as PRODUCTS_CATEGORIES;

                    validate(category, "Category is not valid.", isValidCategory);

                    return Reflect.set(obj, prop, category);
                }
                case "expirable": {
                    if(!newValue || typeof newValue !== "object") return Reflect.set(obj, prop, null);

                    testCategory(PRODUCTS_CATEGORIES.EXPIRABLE, obj)
                    
                    const expirableDetails = newValue as ExpirableProductType; 

                    if(!isValidManufactureDate(expirableDetails.manufactureDate, expirableDetails.expirationDate)) {
                        throw new InvalidArgumentError( "Invalid manufacture date");
                    }

                    if(!isValidBestBefore(expirableDetails.expirationDate, expirableDetails.manufactureDate)) {
                        throw new InvalidArgumentError("Invalid best before")
                    }
                    
                    return Reflect.set(obj, prop, expirableDetails);
                }
                case "furnicture": {
                    if(!newValue || typeof newValue !== "object") return Reflect.set(obj, prop, null);

                    testCategory(PRODUCTS_CATEGORIES.FURNITURE, obj)

                    const furnicture = newValue as FurnictureType;
                    const { height, length, width } = furnicture.dimensions;

                    validate(furnicture.material, "Furnicture's material is not valid.", isValidMaterial)
                   
                    if(!isValidDimesions(length.toString(), width.toString(), height.toString())) {
                        throw new InvalidArgumentError("Invalid furnicture's dimension")
                    }

                    return Reflect.set(obj, prop, furnicture);
                }
                case "name": {
                    const name = newValue as string;

                    validate(name, "Name is not valid.", isValidName);

                    return Reflect.set(obj, prop, name);
                }
                case "profit": {
                    isLessThanZero(newValue, "Profit must not be less than or equal to zero");

                    return Reflect.set(obj, prop, newValue as number);
                }
                case "purchasePrice": {
                    const isValid = isValidPurchasePrice((newValue as number).toString(), obj.sellPrice);

                    if(!isValid) throw new InvalidArgumentError( "Purchase price must not be less than to zero")

                    return Reflect.set(obj, prop, newValue);
                }
                case "quantity": {
                    validate((newValue as number).toString(), "Quantity must not be less than zero", isValidQuantity);

                    return Reflect.set(obj, prop, newValue);
                }
                case "sellPrice": {
                    const isValid = isValidSellPrice((newValue as number).toString(), obj.purchasePrice)

                    if(!isValid) throw new InvalidArgumentError("Sell price must not be less than zero or less than purchase price")

                    return Reflect.set(obj, prop, newValue as number);
                }
            }

            return false
        }
    }

    return new Proxy(target, proxyHandler)
}

export default getProductProxy