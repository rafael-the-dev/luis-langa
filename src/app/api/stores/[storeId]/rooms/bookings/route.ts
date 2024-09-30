import { NextRequest, NextResponse } from "next/server"

import { BookingType } from "@/types/booking"
import { URLParamsType } from "@/types/app-config-server"

import { apiHandler } from "@/middlewares/route-handler"

import Booking from "@/models/server/db/Booking"

export const GET = (req: NextRequest, { params: { storeId } }: URLParamsType) => {
    const params = new URLSearchParams(req.nextUrl.search)
    const property = params.get("property")

    return apiHandler(
        req,
        async ({ mongoDbConfig, user }) => {
            const rooms = await Booking.getAll(
                { 
                    filters: {
                        ...( property ? { property} : {})
                    } 
                },
                { 
                    mongoDbConfig, 
                    user 
                }
            )

            return NextResponse.json(rooms)
        }
    )
}

export const POST = (req: NextRequest, { params: { storeId } }: URLParamsType) => {
    return apiHandler(
        req,
        async ({ mongoDbConfig, user }) => { 
            const booking = await req.json() as BookingType

            await Booking.register(booking, storeId, { mongoDbConfig, user })

            return NextResponse.json(
                { message: "Booking was successfully created" }, 
                { status: 201 }
            )
        }
    )
}