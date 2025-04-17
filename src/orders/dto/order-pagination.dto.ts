import { IsEnum, IsOptional } from "class-validator";
import { PaginationDto } from "src/common";
import { OrdersStatusList } from "../enum/enum.orders";
import { OrderStatus } from "generated/prisma";


export class OrderPaginationDto extends PaginationDto{
    
    @IsOptional()
    @IsEnum( OrdersStatusList, {
        message: `Valid status are ${ OrdersStatusList }`
    })
    status: OrderStatus;
}