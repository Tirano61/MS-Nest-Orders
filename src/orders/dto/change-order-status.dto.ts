import { IsEnum, IsUUID } from "class-validator";
import { OrderStatus } from "generated/prisma";
import { OrdersStatusList } from "../enum/enum.orders";


export class ChangeOrderStatusDto {
    
    @IsUUID()
    id: string;

    @IsEnum( OrdersStatusList, {
        message: `Valid status are ${ OrdersStatusList } `
    })
    status: OrderStatus;
}