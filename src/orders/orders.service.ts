import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaClient } from 'generated/prisma';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { stat } from 'fs';
import { PRODUCT_SERVICE } from 'src/config/services';
import { firstValueFrom } from 'rxjs';
import { OrderItem } from '../../generated/prisma/index';


@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {

  private logger = new Logger('Orders-Service');

  constructor(
    @Inject(PRODUCT_SERVICE) private readonly productsClient: ClientProxy,
  ){super();}

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected !!!')
  }

  async create(createOrderDto: CreateOrderDto) {

    try {
      const productIds = createOrderDto.items.map( item => item.productId );
      
      // 1- Confirmar los ids de los productos
      const products = await firstValueFrom(
        this.productsClient.send({ cmd: 'validate_product'}, productIds)
      );
      // 2-Calculos de los valores
      const totalAmount =  createOrderDto.items.reduce( (acc, orderItems) => {
        const price = products.find( product => product.id === orderItems.productId ).price;

        return price * orderItems.quantity  
      }, 0);

      const totalItems = createOrderDto.items.reduce( (acc, orderItems) => {
        return acc + orderItems.quantity;
      }, 0);

      // 3- Crear una transaccion de base de datos
      const order = await this.order.create({
        data:{
          totalAmount: totalAmount,
          totalItems: totalItems,
          OrderItem:{
            createMany:{
              data: createOrderDto.items.map( ( orItem ) => ({
                price: products.find( product => product.id === orItem.productId).price,
                productId: orItem.productId,
                quantity: orItem.quantity 
              }))
            }
          }
        },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            }
          }
        }
      });

      return {
        ...order,
        OrderItem: order.OrderItem.map((orderItem) =>({
          ...orderItem,
          name: products.find( prod => prod.id === orderItem.productId).name,
        }))
      };
      
    } catch (error) {
      throw new RpcException({ 
        status: HttpStatus.BAD_REQUEST, 
        message: `Check logs for the products request`
      });
    }

  
    
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
    const order = await this.order.findUnique({
      where: { id }, 
      include:{
        OrderItem: {
          select:{
            price: true,
            quantity: true,
            productId: true
          }
        }
      }
    });

    if( !order ){
      throw new RpcException({ 
        status: HttpStatus.NOT_FOUND, 
        message: `Order with id ${ id } not found`
      });
    }

    const productIds = order.OrderItem.map( (orderItem) => orderItem.productId);
    const products = await firstValueFrom(
      this.productsClient.send({ cmd: 'validate_product'}, productIds)
    );

    return {
      ...order,
      OrderItem: order.OrderItem.map( orderItem => ({
        ...orderItem,
        name: products.find( product => product.id === orderItem.productId).name
      }))
    }


  }

  async changeStatus(changeOrderStatusDto: ChangeOrderStatusDto) {
    const { id, status } = changeOrderStatusDto;
    const order = await this.findOne(id);
  
    if (!order) {
      throw new RpcException({
        status: 404,
        message: `Order with id ${id} not found`,
      });
    }
  
    if (order.status === status) {
      return order;
    }
  
    try {
      return await this.order.update({
        where: { id },
        data: { status: status },
      });
    } catch (error) {
      throw new RpcException({
        status: 500,
        message: `Failed to update status for order with id ${id}`,
      });
    }
  }

}
