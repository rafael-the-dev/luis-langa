
import { ConfigType, FiltersType } from "@/types/app-config-server"
import { BaseFeeType, FeeType, FEES_TYPE } from "@/types/fees"

import getFeeProxy from "./proxy"
import { getId } from "@/helpers/id"
import { getFees } from "./helpers/db"
import { toISOString } from "@/helpers/date"

class Fees {
    static async getAll(filters: FiltersType, config: ConfigType) {
        const data = await getFees(filters, config)
       
        return { data }
    }

    static async register(newFee: BaseFeeType, config: ConfigType) {
        const { storeId } = config.user.stores[0]

        const id = getId()

        const fee: FeeType = {
            createdAt: toISOString(new Date(Date.now())),
            id,
            latePaymentFine: false,
            price: 0,
            payment: null,
            storeId,
            status: null,
            type: null,
            total: 0,
            registeredBy: config.user.username,
        }

        const feeProxy = getFeeProxy(fee, 8500)

        if(newFee.type === FEES_TYPE.ENROLLMENT) feeProxy.latePaymentFine = false;
        else feeProxy.latePaymentFine = true;
        
        feeProxy.payment = newFee.payment;
        feeProxy.type = newFee.type;

        try {
            await config
                .mongoDbConfig
                .collections
                .FEES
                .insertOne(fee)
        } catch(e) {
            await config
                .mongoDbConfig
                .collections
                .FEES
                .deleteOne(
                    {
                        id
                    }
                )

            throw e
        }
    }
}

export default Fees