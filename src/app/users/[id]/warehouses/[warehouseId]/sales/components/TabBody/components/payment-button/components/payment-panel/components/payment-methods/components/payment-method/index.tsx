import * as React from "react";
import { IconButton, MenuItem } from "@mui/material"
import { v4 as uuidV4 } from "uuid";
import classNames from "classnames"

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';

import styles from "./styles.module.css";

// import { CheckoutContext } from "src/context"

import Input from "@/components/Textfield";
import { SaleContext } from "@/context/SalesContext/context/SaleContext";
import { PaymentMethodListItemType } from "@/types/payment-method";

const paymentMethodsList: PaymentMethodListItemType[] = [
    { value: 100, label: "Cash" },
    { value: 200, label: "M-pesa" },
    { value: 300, label: "E-mola" },
    { value: 400, label: "M-kesh" },
    { value: 500, label: "POS" },
    { value: 600, label: "P24" }
];

const PaymentMethodContainer = ({ amount, id, receivedAmount }) => {

    const { 
        changePaymentMethodId, changePaymentMethodValue,
        getPaymentMethods, 
        removePaymentMethod 
    } = React.useContext(SaleContext);

    const filter = React.useCallback((item: PaymentMethodListItemType) => {
        if(item.value === id) return true;

        return !Boolean(getPaymentMethods().find(method => {
            return method.id === item.value
        }));
    }, [ getPaymentMethods, id ]);

    const changeHandler = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => changePaymentMethodValue("amount", id, e.target.value.trim())
    , [ changePaymentMethodValue, id ]);

    const changeMethodHandler = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => changePaymentMethodId(id, parseInt(e.target.value)), 
    [ changePaymentMethodId, id ]);

    const clearRemaingAmount = () => {
        // getPaymentMethods().clearRemaingAmount(id);
    };

    const removeHandler = React.useCallback(() => removePaymentMethod(id), [ id, removePaymentMethod ]);
    
    const receivedAmountChangeHandler = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => changePaymentMethodValue("receivedAmount", id, e.target.value.trim())
    , [ changePaymentMethodValue, id ]);

    return (
        <div className="border-b border-primary-300 border-solid flex flex-col pb-3 pt-8 first:pt-0 md:pb-8 md:flex-row">
            <Input
                className={classNames(styles.select)}
                label="Metodo de pagamento"
                onChange={changeMethodHandler}
                select
                value={id}
                variant="outlined"
                >
                {
                    paymentMethodsList
                        .filter(filter)
                        .map(item => (
                        <MenuItem key={item.value} value={item.value}>
                            { item.label }
                        </MenuItem>
                    ))
                }
            </Input>
            <div className="flex items-center justify-between w-full md:justify-normal">
                <Input 
                    className={styles.input}
                    label="Insere o valor"
                    onChange={changeHandler}
                    value={amount}
                    variant="outlined"
                />
                <Input 
                    className={styles.input}
                    label="Valor recebido"
                    onChange={receivedAmountChangeHandler}
                    value={receivedAmount}
                    variant="outlined"
                />
            </div>
            <div className="flex">
                { /*getPaymentMethods().amountRemaining() > 0 && (
                    <IconButton 
                        className="text-blue-500 hover:text-blue-700"
                        onClick={clearRemaingAmount}>
                        <CheckCircleIcon />
                    </IconButton>
                )*/}
                <IconButton 
                    className="hover:text-red-600" 
                    onClick={removeHandler}>
                    <DeleteIcon />
                </IconButton>
            </div>
        </div>
    );
};

export default PaymentMethodContainer;