
import { ConfigType } from "@/types/app-config-server";
import { FetchResponseType, STATUS } from "@/types";
import { PropertyType } from "@/types/property";

import { getId } from "@/helpers/id";
import { getProperties, setProperty, updateRoom } from "./helpers";
import { toISOString } from "@/helpers/date";

import Error404 from "@/errors/server/404Error";
import InvalidArgumentError from "@/errors/server/InvalidArgumentError";

class Room {
    static async get({ filter }: { filter: Object }, { mongoDbConfig, user }: ConfigType) {
        const storeId = user.stores[0].storeId;

        const list = await getProperties({ filter, storeId }, { mongoDbConfig, user })

        if(list.length === 0) throw new Error404("Property not found")
        
        const property = list[0]

        return property
    }

    static async getAll({ filter }: { filter: Object }, { mongoDbConfig, user }: ConfigType): Promise<FetchResponseType<PropertyType[]>> {
        const storeId = user.stores[0].storeId;

        const properties = await getProperties({ filter, storeId }, { mongoDbConfig, user })

        return { data: properties }
    }

    static async register(property: PropertyType, { mongoDbConfig, user }: ConfigType) {
        if(!property) throw new InvalidArgumentError("Invalid properrty")

        const id = getId();
        const storeId = user.stores[0].storeId;

        try {
            const newProperty: PropertyType = {
                address: null,
                availability: null,
                description: property.description,
                amenities: [],
                bedroom: null,
                house: null,
                id,
                images: null,
                name: null,
                owner: storeId,
                price: null,
                status: STATUS.ACTIVE,
                type: null
            }

            setProperty(newProperty, property)

            await mongoDbConfig
                .collections
                .PROPERTIES
                .insertOne(newProperty);

            await mongoDbConfig
                .collections
                .WAREHOUSES
                .updateOne(
                    { id: storeId },
                    {
                        $push: {
                            rooms: {
                                id,
                                createdAt: toISOString(Date.now())
                            }
                        }
                    }
                );

        } catch(e) {
            Promise.all(
                [
                    mongoDbConfig
                        .collections
                        .PROPERTIES
                        .deleteOne(
                            { id }
                        ),
                    mongoDbConfig
                        .collections
                        .WAREHOUSES
                        .updateOne(
                            { id: storeId },
                            {
                                $pull: {
                                    rooms: {
                                        id
                                    }
                                }
                            }
                )
                ]
            );

            throw e
        }
    }

    static async upddate(property: PropertyType, { mongoDbConfig, user }: ConfigType) {
        if(!property) throw new InvalidArgumentError("Invalid properrty")

        const storeId = user.stores[0].storeId;

        const currentProperty = await this.get(
            { 
                filter: {
                    id: property.id,
                    owner: storeId
                }
            },
            { 
                mongoDbConfig, 
                user 
            }
        );

        const propertyClone = structuredClone(currentProperty);
        
        try {
            // this is a optional field, It does not need validation
            propertyClone.description = property.description

            setProperty(propertyClone, property)

            await updateRoom(propertyClone, storeId, mongoDbConfig);
        } catch(e) {
            await updateRoom(currentProperty, storeId, mongoDbConfig);

            throw e;
        }
    }
}

export default Room