import { ChangeEvent, useCallback, useState } from "react"

import { DOCUMENT_TYPE } from "@/types/user"

import { initial } from "./values"

import { isValidDocumentExpireDate, isValidDocumentIssueDate,isValidDocumentNumber } from "@/validation/user"
import { defaultInputField } from "@/config/input"

const useDocument = () => {
    const [ document, setDocument ] = useState(initial)

    const changeDocumentExpireDate = useCallback((newDate: string) => {
        setDocument(document => {
            const hasError = !isValidDocumentExpireDate(newDate, document.issueDate.value)

            return {
                ...document,
                expireDate: {
                    error: hasError,
                    helperText: hasError ? "Invalid date" : "",
                    value: newDate
                }
            }
        })
    }, [])

    const changeDocumentIssueDate = useCallback((newDate: string) => {
        setDocument(document => {
            const hasError = !isValidDocumentIssueDate(newDate)

            return {
                ...document,
                issueDate: {
                    error: hasError,
                    helperText: hasError ? "Invalid date" : "",
                    value: newDate
                }
            }
        })
    }, [])

    const changeDocumentType = useCallback((documentType: DOCUMENT_TYPE) => {
        setDocument(document => ({
            ...document,
            type:  {
                error: false,
                helperText: "",
                value: documentType
            }
        }))
    }, [])

    const changeDocumentNumber = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;

        const hasError = !isValidDocumentNumber(value);

        setDocument(document => ({
            ...document,
            number:  {
                error: hasError,
                helperText: "",
                value
            }
        }));
    }, [])

    const resetDocument = useCallback(
        () => setDocument(initial),
        []
    )

    const isValid = useCallback(
        (obj: typeof defaultInputField) => obj.error || !obj.value.trim(),
        []
    )

    const hasErrors = () => {
        return [
            document.expireDate.error,
            document.issueDate.error,
            isValid(document.number),
            isValid(document.type)
        ].find(error => error)
    }

    return {
        document,

        changeDocumentExpireDate,
        changeDocumentIssueDate,
        changeDocumentNumber,
        changeDocumentType,
        resetDocument,
        hasErrors
    }
}

export default useDocument