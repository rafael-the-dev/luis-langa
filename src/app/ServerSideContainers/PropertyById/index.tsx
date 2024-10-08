"use server"

import { FC, ReactNode } from "react"

import { BookingsResponseType } from "@/types/booking"
import { PropertyType } from "@/types/property"

import { PropertyContextProvider } from "@/context/PropertyContext"

type PropertiesSSCPropsType = {
    children: ReactNode,
    queryParams: string
}

type PropsType = {
    children: ReactNode,
    id: string,
    PropertiesSSC: FC<PropertiesSSCPropsType>,
    queryParams: string
}

const PropertyContainer = async ({ children, id, PropertiesSSC, queryParams }: PropsType) => {
    let property: PropertyType = null;
    let bookings: BookingsResponseType = null;
    let error: Error = null;

    const url = process.env.MODE === "PRODUCTION" ? process.env.LIVE_URL : `http://localhost:${process.env.PORT}`

    try {
        const res = await fetch(`${url}/api/stores/properties/${id}`);
        property = await res.json() as PropertyType;

        const bookingsResponse= await fetch(`${url}/api/stores/${property?.owner}/properties/bookings?property=${id}`);
        bookings = await bookingsResponse.json() as BookingsResponseType;
    } catch(e) {
        console.error(e.message);
        error = e;
    }

    return (
        <PropertyContextProvider
            bookings={bookings}
            property={property}
            error={null}>
            <PropertiesSSC queryParams={queryParams}>
                { children }
            </PropertiesSSC>
        </PropertyContextProvider>
    )
}

export default PropertyContainer