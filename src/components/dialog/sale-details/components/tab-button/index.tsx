import { MouseEvent, ReactNode } from "react"
import classNames from "classnames"

import styles from "./styles.module.css"

import Button from "@mui/material/Button";

type PropsType = {
    children: ReactNode;
    id: string;
    onClick: (id: string) => (e: MouseEvent<HTMLButtonElement>) => void;
    selectedTab: string;
}

const ButtonContainer = ({ children, id, onClick, selectedTab }: PropsType) => {

    return (
        <li className={classNames(styles.listItem, "sm:w-1/3")}>
            <Button
                className={classNames("border-0 py-2 text-nowrap rounded-none w-full",
                    id === selectedTab ? "bg-stone-500 text-white" : "bg-stone-300 text-black")}
                    onClick={onClick(id)}
                >
                { children }
            </Button>
        </li>
    );
};

export default ButtonContainer;