import { useCallback, useContext, useMemo, useState } from "react"
import moment from "moment"

import { BOOKING_TYPE } from "@/types/room"

import { RoomsContext } from "@/app/stores/[storeId]/rooms/context"

import { isValidBookingType, validateCheckIn, validateCheckOut } from "@/validation/booking"
import { getTotalPrice } from "@/helpers/booking"

const initialInput = {
    error: false,
    helperText: "",
    value: ""
}

const initial = {
    checkIn: structuredClone({ ...initialInput, value: moment(new Date(Date.now())).add(20, 'minutes').toISOString() }),
    checkOut: structuredClone({ ...initialInput, value: moment(new Date(Date.now())).add(2, "hour").toISOString() }),
    property: null,
    store: null,
    type: structuredClone({ ...initialInput, value: BOOKING_TYPE.HOURLY }),
    totalPrice: 0
}

const useBooking = () => {
    const { getProperties } = useContext(RoomsContext)

    const [ booking, setBooking ] = useState(initial)

    const hasErrors = useMemo(
        () => {
           return !Boolean(booking.property) || booking.totalPrice <= 0 || booking.checkIn.error || booking.checkOut.error
        },
        [ booking ]
    )

    const changeRoom = useCallback(
        (id: string) => {
            const property = getProperties().find(room => room.id === id)

            setBooking(
                booking => ({
                    ...booking,
                    property,
                    totalPrice: getTotalPrice(booking.type.value, booking.checkIn.value, booking.checkOut.value, property)
                })
            )
        },
        [ getProperties ]
    )

    const changeType = useCallback(
        (bookingType: BOOKING_TYPE) => {
            const isValid = isValidBookingType(bookingType)

            setBooking(
                booking => ({
                    ...booking,
                    totalPrice: getTotalPrice(bookingType, booking.checkIn.value, booking.checkOut.value, booking.property),
                    type: {
                        error: !isValid,
                        helperText: isValid ? "" : "Invalid type",
                        value: bookingType
                    }
                })
            )
        }, 
        []
    )

    const changeTime = useCallback(
        (prop: "checkIn" | "checkOut" ) => 
            (newTime: string) => {
                setBooking(
                    booking => {
                        let error = false;
                        let helperText = "";
                        let totalPrice = 0;

                        const bookingClone = { ...booking };

                        if(prop === "checkIn") {
                            const { hasError, message } = validateCheckIn(newTime, booking.checkOut.value);

                            error = hasError;
                            helperText = message;
    
                            bookingClone.totalPrice = getTotalPrice(booking.type.value, newTime, booking.checkOut.value, booking.property);
                        } else {
                            const { hasError, message } = validateCheckOut(booking.checkIn.value, newTime);

                            error = hasError;
                            helperText = message;
                            bookingClone.totalPrice = getTotalPrice(booking.type.value, booking.checkIn.value, newTime, booking.property);
                            
                            const checkInValidation = validateCheckIn(bookingClone.checkIn.value, newTime);

                            bookingClone["checkIn"].error = checkInValidation.hasError;
                            bookingClone['checkIn'].helperText = checkInValidation.message;
                        }

                        bookingClone[prop] = {
                            error,
                            helperText,
                            value: newTime
                        };



                        return bookingClone;
                    }
                )
            },
        []
    )

    const resetBooking = useCallback(
        () => setBooking(structuredClone(initial)),
        []
    )

    return {
        booking,
        hasErrors,

        changeRoom,
        changeType,
        changeTime,

        resetBooking
    }
}

export default useBooking