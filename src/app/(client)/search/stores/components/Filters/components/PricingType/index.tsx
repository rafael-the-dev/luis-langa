import { ChangeEvent, useCallback } from "react"
import FormGroup from "@mui/material/FormGroup"

import useSearchParams from "@/hooks/useSearchParams"

import Collapse from "@/components/shared/collapse"
import RadioButton from "@/components/radio-button"

enum PRICING_TYPES {
    ALL = "All",
    DAILY = "daily",
    HOURLY = "hourly"
}

const PricingType = () => {
    const searchParams = useSearchParams()

    const pricingType = searchParams.get("pricing-type", PRICING_TYPES.ALL)

    const changeHandler = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => searchParams.setSearchParam("pricing-type", e.target.value),
        [ searchParams ]
    )

    return (
        <Collapse classes={{ root: "bg-white" }} title="Type of price">
            <FormGroup>
                {
                    Object
                        .values(PRICING_TYPES)
                        .map(value => (
                            <RadioButton 
                                checked={searchParams.isChecked(pricingType, value)}
                                key={value}
                                label={value}
                                onChange={changeHandler}
                                value={value}
                            />
                        ))
                }
            </FormGroup>
        </Collapse>
    )
}

export default PricingType