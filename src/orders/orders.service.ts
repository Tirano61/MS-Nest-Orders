import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaClient } from 'generated/prisma';
import { RpcException } from '@nestjs/microservices';
import { stat } from 'fs';
import { OrderPaginationDto } from './dto/order-pagination.dto';


@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {

  private logger = new Logger('Orders-Service')

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected !!!')
  }

  create(createOrderDto: CreateOrderDto) {
    return this.order.create({
      data: createOrderDto
    });
    
  }

  async findAll( orderPaginationDto: OrderPaginationDto) {
    const totalPages = await this.order.count({
      where: {
        status: orderPaginationDto.status
      }
    });
    const currentPage = orderPaginationDto.page;
    const perPage = orderPaginationDto.limit;
    return {
      data: await this.order.findMany({
        skip: ( currentPage -1 ) * perPage,
        take: perPage,
        where: {
          status: orderPaginationDto.status,
        }
      }),
      meta : {
        total: totalPages,
        page: currentPage,
        lastPage: Math.ceil( totalPages / perPage ),
      }
    }
  }

  async findOne(id: string) {
    const order = await this.order.findUnique({where: { id } });
    if( !order ){
      throw new RpcException({ 
        status: HttpStatus.NOT_FOUND, 
        message: `Order with id ${ id } not found`
      });
    }
    return order;
  }


}
