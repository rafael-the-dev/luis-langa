import classNames from "classnames"
import Chip from "@mui/material/Chip"

import { CATEGORY_STATUS } from "@/types/category"
import { STATUS } from "@/types"

const StatusContainer = ({ className, status }: { className?: string, status: STATUS | CATEGORY_STATUS }) => (
    <Chip 
        classes={{ root: classNames(status === STATUS.ACTIVE ? "bg-green-400" : "bg-red-600") }}
        className={classNames(className, `mr-3 text-xs text-gray-700`)}
        label={status} 
    />
)

export default StatusContainer