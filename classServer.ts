import 'reflect-metadata';
// 商品服务类
class WareService {
    private _stock: number = 10; // 库存

    get stock(): number {
        return this._stock;
    }

    decreaseStock(): void {
        this._stock--;
    }
}

// 购物车服务类
class CartService {
    private _wareCount: number = 0; // 购物车商品数量

    get wareCount(): number {
        return this._wareCount;
    }

    increaseWareCount(): void {
        this._wareCount++;
    }
}
// 类装饰器，其本质是函数
export function Injectablexxx(constructor: new (...args: any[]) => void): void {
}

// 商品组件类
@Injectablexxx
class WareComponent {
    // 构造商品组件，依赖于商品服务和购物车服务
    constructor(private wareService: WareService, private cartService: CartService) {
    }

    // 添加商品的购物车：减少商品库存量，同时增加购物车商品数量
    addToCart(): void {
        this.wareService.decreaseStock();
        this.cartService.increaseWareCount();
        console.log(`
            已成功添加商品到购物车，目前商品库存：${this.wareService.stock}；
            购物车商品数量：${this.cartService.wareCount}。
        `);
    }
}

export { WareService, CartService, WareComponent }