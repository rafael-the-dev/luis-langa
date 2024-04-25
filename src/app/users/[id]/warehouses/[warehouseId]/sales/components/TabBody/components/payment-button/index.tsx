import * as React from "react"
import classNames from "classnames"

import { AppContext } from "@/context/AppContext"
import { SaleContext } from "@/context/SalesContext/context/SaleContext"

import Button from "@/components/shared/button"
import Dialog from "@/components/dialog"
import PaymentPanel from "./components/payment-panel"

const PaymentButton = () => {
    const { getCart, isEmpty } = React.useContext(SaleContext)

    const onOpenRef = React.useRef<() => void>(null)

    const clickHandler = React.useCallback(() => onOpenRef.current?.(), [])
    
    return (
        <>
            <Button
                className={classNames(" border-0 opacity-90 py-4 px-6 rounded-none md:py-6 md:px-16 md:text-xl", { "opacity-60": isEmpty })}
                disabled={isEmpty}
                onClick={clickHandler}>
                Pay { getCart().total } MT
            </Button>
            <Dialog
                classes={{ paper: "m-0 md:max-w-max"}}
                onOpenRef={onOpenRef}>
                <PaymentPanel />
            </Dialog>
        </>
    )
}

export default PaymentButton