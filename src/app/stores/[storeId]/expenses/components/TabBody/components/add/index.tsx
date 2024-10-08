import { ChangeEvent, useCallback, useContext, useEffect, useRef, useState } from "react"
import classNames from "classnames";
import DeleteButton from "@mui/material/Button"

import styles from "./styles.module.css"
import { FetchDataFuncType } from "@/hooks/useFetch/types";
import { ExpenseInfoType } from "@/types/expense";

import useFetch from "@/hooks/useFetch";
import { AppContext } from "@/context/AppContext";
import { ExpensesContext } from "@/context/ExpensesContext";

import Button from "@/components/shared/button"
import Categories from "./components/categories"
import ListItem from "./components/expense-item";
import TextField from "@/components/Textfield";
import { LoginContext } from "@/context/LoginContext";


const RegisterExpenses = ({ refreshData }: { refreshData: FetchDataFuncType }) => {
    const { credentials } = useContext(LoginContext)
    const { dialog, setDialog } = useContext(AppContext)
    const { addItem, getItems, totalPrice, toString } = useContext(ExpensesContext);

    const requestMethod = useRef("")
    
    const { loading, fetchData } = useFetch({ 
        autoFetch: false, 
        url: `/api/stores/${credentials?.user?.stores[0]?.storeId}/expenses` 
    })

    const onSuccess = async () => {
        await refreshData({});
        setDialog(null);
    }

    const deleteHandler = () => {
        const expense = dialog.payload as ExpenseInfoType;
        requestMethod.current = "DELETE";

        fetchData({
            onSuccess,
            options: {
                method: "DELETE",
            },
            path: `/api/stores/${credentials?.user?.stores[0]?.storeId}/expenses/${expense.id}`
        })
    }

    const submitHandler = async () => {
        const expense = dialog.payload as ExpenseInfoType;
        requestMethod.current = expense ? "PUT" : "POST";

        fetchData({
            onSuccess,
            options: {
                method: requestMethod.current,
                body: toString()
            },
            ...( expense ? { 
                path: `/api/stores/${credentials?.user?.stores[0]?.storeId}/expenses/${expense.id}`
            } : {} )
        })
    };

    return (
        <form className={classNames(styles.form, `h-fit`)}>
            <div className="flex flex-col h-full justify-between px-3 pb-4 pt-8">
                <div>
                    <div className="flex flex-col items-stretch justify-between sm:flex-row">
                        <TextField
                            className={classNames(styles.input, `font-semibold`)}
                            inputProps={{ readOnly: true }}
                            label="Total Price"
                            value={totalPrice}
                        />
                        <Categories />
                    </div>
                    <div>
                        {
                            getItems().map(item => (
                                <ListItem { ...item } key={item.id} />
                            ))
                        }
                    </div>
                    <div className="flex justify-center">
                        <Button onClick={addItem}>Add new item</Button>
                    </div>
                </div>
                <div className="flex justify-end mt-16">
                    {
                        dialog.payload && (
                            <DeleteButton
                                className="py-2 px-6 border border-solid border-red-600 text-red-600 mr-4 hover:bg-red-600 hover:text-white"
                                onClick={deleteHandler}>
                                { loading && requestMethod.current === "DELETE" ? "Loading..." : "Delete" }
                            </DeleteButton>
                        )
                    }
                    <Button onClick={submitHandler}>
                        { loading && [ "POST", "PUT" ].includes(requestMethod.current) ? "Loading..." : (dialog.payload ? "Update" : "Submit") }
                    </Button>
                </div>
            </div>
        </form>
    )
};

export default RegisterExpenses;