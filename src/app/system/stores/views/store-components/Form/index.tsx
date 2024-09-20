import { FormEvent, useContext, useMemo, useRef } from "react"
import classNames from "classnames"

import styles from "./styles.module.css"

import { AppContext } from "@/context/AppContext"
import { FormContext, FormContextProvider } from "./context"

import useFetch from "@/hooks/useFetch"

import Alert from "@/components/alert"
import Button from "@/components/shared/button"
import BaseDetailsStep from "./components/BaseDetails"
import PaymentStep from "./components/Payment"
import Stepper from "@/components/stepper"
import UsersStep from "./components/User"

const Form = () => {
    const { fetchDataRef } = useContext(AppContext)
    const { hasErrors, toLiteralObject } = useContext(FormContext)

    const hasPayload = false
    const hasError = hasErrors()
    
    const { fetchData, loading } = useFetch(
        {
            autoFetch: false,
            url: `/api/stores/`
        }
    )
    
    const fetchStoresFuncRef = fetchDataRef;

    const alertProps = useRef({
        description: "",
        severity: "",
        title: ""
    })

    const onClose = useRef<() => void>(null);
    const onOpen = useRef<() => void>(null);
    const resetStepperRef = useRef<() => void>(null);

    const alert = useMemo(
        () => (
            <Alert 
                { ...alertProps.current }
                className={classNames("mb-6", loading)}
                onClose={onClose}
                onOpen={onOpen}
            />
        ), 
        [ loading ]
    )

    const submitHandler = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if(hasError || loading) return;

        onClose.current?.();

        await fetchData(
            {
                options: {
                    body: JSON.stringify(toLiteralObject()),
                    method: "POST"
                },
                onError(error) {
                    alertProps.current = {
                        description: error.message,
                        severity: "error",
                        title: "Error"
                    }
                },
                async onSuccess() {
                    alertProps.current = {
                        description: `Store was successfully registered`,
                        severity: "success",
                        title: "Success"
                    }

                    await fetchStoresFuncRef.current?.({})
                }
            }
        )

        onOpen.current?.()
    }


    return (
        <form 
            className={classNames(styles.stepper, "!overflow-hidden")}
            onSubmit={submitHandler}>
            { alert }
            <Stepper 
                className={classNames(styles.stepper, "box-border flex flex-col items-stretch justify-between overflow-y-auto px-2 py-4 sm:pt-6 sm:px-4")}
                components={[ <BaseDetailsStep key={0} />, <UsersStep key={1} />, <PaymentStep key={2} /> ]}
                resetStepperRef={resetStepperRef}
                FinishButton={
                    () => (
                        <Button
                            className="py-2"
                            disabled={hasError}
                            type="submit">
                            { loading ? "Loading..." : ( hasPayload ? "Update" : "Submit" ) }
                        </Button>
                    )
                }
                steps={[ "Details", "Admin", "Payment" ]}
            />
        </form>
    )
}

const Provider = () => (
    <FormContextProvider>
        <Form />
    </FormContextProvider>
)

export default Provider