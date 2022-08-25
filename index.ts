import { WareService, CartService, WareComponent, Injectablexxx } from './classServer'
import DependencyInjector from './diServer';

// // 创建商品服务、购物车服务和商品组件
// let wareService = new WareService();
// let cartService = new CartService();
// let wareComponent = new WareComponent(wareService, cartService);

// // 调用商品组件的addToCart()方法，以添加商品到购物车中
// wareComponent.addToCart(); // 输出“已成功添加商品到购物车，目前商品库存：9；购物车商品数量：1。”
// wareComponent.addToCart(); // 输出“已成功添加商品到购物车，目前商品库存：8；购物车商品数量：2。”


// Reflect.defineMetadata('design:paramtypes', [WareService, CartService], WareComponent);

// 通过依赖注入器获取商品组件实例，并调用其addToCart()方法
let wareComponent = DependencyInjector.getService(WareComponent);
wareComponent.addToCart();

// 定义并装饰Index类
@Injectablexxx
class Index {
    // 构造依赖于WareComponent实例的Index实例
    constructor(private wareComponent: WareComponent) {
    }

    // 运行以调用WareComponent实例的addToCart()方法
    run(): void {
        this.wareComponent.addToCart();
    }
}

// 通过依赖注入器获取Index实例，并调用它的run()方法
let index = DependencyInjector.getService(Index);
index.run();
