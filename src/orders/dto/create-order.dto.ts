import { IsBoolean, IsEnum, IsNumber, IsOptional, IsPositive } from "class-validator";
import { OrderStatus } from "generated/prisma";
import { boolean } from "joi";
import { OrdersStatusList } from "../enum/enum.orders";

export class CreateOrderDto {

    @IsNumber()
    @IsPositive()
    totalAmount: number;
    
    @IsNumber()
    @IsPositive()
    totalItems: number;

    @IsEnum( OrdersStatusList, {
        message: `Possible status values are ${ OrdersStatusList }`
    })
    @IsOptional()
    status: OrderStatus = OrderStatus.PENDING;

    @IsBoolean()
    @IsOptional()
    paid: boolean = false;

}
