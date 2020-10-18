import { inject, injectable } from 'tsyringe'

import AppError from '@shared/errors/AppError'

import IProductsRepository from '@modules/products/repositories/IProductsRepository'
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository'
import Order from '../infra/typeorm/entities/Order'
import IOrdersRepository from '../repositories/IOrdersRepository'

interface IProduct {
  id: string
  quantity: number
}

interface IRequest {
  customer_id: string
  products: IProduct[]
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id)

    if (!customer) throw new AppError('Cliente inexistente')

    const findProducts = await this.productsRepository.findAllById(products)

    if (findProducts.length === 0)
      throw new AppError('Nenhum produto encontrado')

    const foundedIds = findProducts.map(({ id }) => id)

    products.forEach((product, index) => {
      if (!foundedIds.includes(product.id))
        throw new AppError(`produto ${product.id} nao encontrado`)

      if (product.quantity > findProducts[index].quantity)
        throw new AppError(`produto ${product.id} com quantidade insuficiente`)
    })

    const convertedProducts = products.map(({ id, quantity }) => ({
      quantity,
      price: findProducts.filter(product => id === product.id)[0].price,
      product_id: id,
    }))

    const order = await this.ordersRepository.create({
      customer,
      products: convertedProducts,
    })

    const { order_products } = order

    const orderProductsQuantities = order_products.map(product => {
      return {
        id: product.product_id,
        quantity:
          findProducts.filter(({ id }) => id === product.product_id)[0]
            .quantity - product.quantity,
      }
    })

    await this.productsRepository.updateQuantity(orderProductsQuantities)

    return order
  }
}

export default CreateOrderService
