'use client';

import * as React from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";

import { ProductFilterType  } from "@/types/product"; 
import { Arapey } from "next/font/google";

type FiltersType = ProductFilterType & {
    isChecked: (origin: string | string[], value: string) => boolean;
    setManySearchParams: (key: string, value: string) => void;
    setUniqueSearchParams: (key: string, value: string) => void
};

export const ProductFilterContext = React.createContext<FiltersType | null>(null);

export const ProductFilterContextProvider = ({ children }: { children: React.ReactNode }) => {
    const params = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    const get =  React.useCallback((key: string, defaultValue: any) => {
        const  value = params.get(key);
        
        return value ?? defaultValue;
    }, [ params ]);
    
    const getAll = React.useCallback((key: string) => params.getAll(key), [ params ]);

    const isChecked = React.useCallback((origin: string | string[], value: string): boolean => origin.includes(value), []);

    const getSearchParams = React.useCallback((key: string, isUnique: boolean = false) => {
        let searchParams = "";

        params.forEach((value, currentKey) => {
            if(isUnique) {
                if(currentKey === key) searchParams += ``;
                else searchParams += `${currentKey}=${value}&`;
            } else {
                searchParams += `${currentKey}=${value}&`
            }
        });

        return searchParams;
    }, [ params ]);

    const setManySearchParams = React.useCallback((key: string, value: string) => {
        const searchParam = params.getAll(key);
        let currentSearchParams = "";
        let searchParams = ``;

        if(searchParam.length > 0) {
            // get current search params different of selected key
            params.forEach((value, currentKey) => {
                if(currentKey !== key) searchParams += `${currentKey}=${value}&`
            });

            if(searchParam.includes(value)) {
                // remove current search param from search params list
                searchParams += searchParam
                    .filter(paramValue => paramValue !== value)
                    .map((paramValue => `${key}=${paramValue}&`))
                    .join("");
            } else {
                // add current value to search params' key
                searchParams += searchParam.map((paramValue => `${key}=${paramValue}&`)).join("");
                searchParams += `${key}=${value}`;
            }
        } else {
            currentSearchParams = getSearchParams(key);
            searchParams = `${currentSearchParams}${key}=${value}`;
        }

        router.push(`${pathname}?${searchParams}`);
    }, [ getSearchParams, params, pathname, router]);

    const setUniqueSearchParams = React.useCallback((key: string, value: string) => {
        let searchParams = `${getSearchParams(key, true)}${key}=${value}`;

        router.push(`${pathname}?${searchParams}`);

    }, [ getSearchParams, pathname, router ]);

    return (
        <ProductFilterContext.Provider
            value={{
                category: params.getAll("category"),
                price: {
                    min: get("min-price", 0),
                    max: get("max-price", 0)
                },
                isChecked,
                setManySearchParams,
                setUniqueSearchParams
            }}>
            { children }
        </ProductFilterContext.Provider>
    )
};

