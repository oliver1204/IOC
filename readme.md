TypeScript中的装饰器的本质是什么？简单来说，是函数。它具体做了什么工作？简单来说，它“装饰”了类、方法、访问器、属性和参数——“它”是指类装饰器、方法装饰器、访问器装饰器、属性装饰器和参数装饰器。那么，装饰到底意味着什么呢？以类装饰器为例，看看它是怎样装饰类的。首先，假设我们需要实现一个添加商品到购物车的功能。为此我们需要一个维护商品库存的商品服务类WareService： // 商品服务类
```js
class WareService {
    private _stock: number = 10; // 库存

    get stock(): number {
        return this._stock;
    }

    decreaseStock(): void {
        this._stock--;
    }
}
```
以及一个维护购物车商品数量的购物车服务类CartService：// 购物车服务类
```js
class CartService {
    private _wareCount: number = 0; // 购物车商品数量

    get wareCount(): number {
        return this._wareCount;
    }

    increaseWareCount(): void {
        this._wareCount++;
    }
}
```
此外我们还需要一个负责添加商品到购物车中的商品组件类WareComponent：// 商品组件类
```js
class WareComponent {
    // 构造商品组件，依赖于商品服务和购物车服务
    constructor(private wareService: WareService, private cartService: CartService) {
    }

    // 添加商品的购物车：减少商品库存量，同时增加购物车商品数量
    addToCart(): void {
        this.wareService.decreaseStock();
        this.cartService.increaseWareCount();
        console.log(`已成功添加商品到购物车，目前商品库存：${this.wareService.stock}；购物车商品数量：${this.cartService.wareCount}。`);
    }
}
```
现在我们打算创建一个商品组件来添加商品到购物车中，为此我们需要这样做：// 创建商品服务、购物车服务和商品组件

```js
let wareService = new WareService();
let cartService = new CartService();
let wareComponent = new WareComponent(wareService, cartService);

// 调用商品组件的addToCart()方法，以添加商品到购物车中
wareComponent.addToCart(); // 输出“已成功添加商品到购物车，目前商品库存：9；购物车商品数量：1。”
wareComponent.addToCart(); // 输出“已成功添加商品到购物车，目前商品库存：8；购物车商品数量：2。”
以上代码看上去是理所当然的，但对于喜欢偷懒的人们来说，其中的商品服务、购物车服务和商品组件的创建很是累人，于是他们发明了类似于以下代码所示的依赖注入器（Dependency Injector）：// 导入reflect-metadata
import 'reflect-metadata';

// 依赖注入器类
abstract class DependencyInjector {
    /**
     * 获取指定类的对象
     * @param constructor 目标对象的类（的构造函数）
     */
    static getService<T>(constructor: new (...args: any[]) => T): T {
        // 获取类装饰器Injectable为目标类定义的名为“design:paramtypes”的元数据
        // 即目标类的构造函数的参数的构造函数组成的数组
        let paramtypes: any = Reflect.getMetadata('design:paramtypes', constructor);

        // 如果目标类上没有名为“design:paramtypes”的元数据
        // 那么直接返回通过这个类创建的对象
        if (!paramtypes || !paramtypes.length) {
            return new constructor();
        }

        // 需要传递给目标类的构造函数的参数数组
        let parameters: any[] = [];
        for (let parameterType of paramtypes) {
            // 递归调用当前方法，创建参数，并将参数添加到参数数组中
            let parameter: any = this.getService(parameterType);
            parameters.push(parameter);
        }

        // 使用参数数组构造目标对象，并将它返回给调用方
        return new constructor(...parameters);
    }
}
```
有了这个依赖注入器之后，我们可以像以下代码那样轻松地获得到商品组件实例，并调用它的addToCart()方法：// 通过依赖注入器获取商品组件实例，并调用其addToCart()方法
```js

let wareComponent = DependencyInjector.getService(WareComponent);
wareComponent.addToCart();
```

但事实上如果我们就这么执行以上两行代码（的编译结果），那么我们会得到JavaScript运行时抛出的以下错误：
```js
TypeError: Cannot read property 'decreaseStock' of undefined
    at WareComponent.addToCart
```

这是为什么呢？在回答这个问题之前我们需要先知道前面的依赖注入器DependencyInjector的定义代码头部导入的reflect-metadata（https://github.com/rbuckton/reflect-metadata）是ECMAScript Reflect提案（https://rbuckton.github.io/reflect-metadata）的一个垫片（Shim），它允许我们定义和获取指定的对象或属性的元数据（Metadata）。那么元数据又是什么呢？它们可以是任何值，比如前面的DependencyInjector的getService()方法中的Reflect.getMetadata('design:paramtypes', constructor)就在试图获取商品组件类WareComponent上名为“design:paramtypes”的元数据，而这个元数据应该是WareComponent的构造函数参数的构造函数组成的数组，即[WareService, CartService]。显然， WareComponent不会平白无故地获得到这么一个元数据，因此当我们试图执行以上代码时，依赖注入器向WareComponent的构造函数的两个参数注入的值都是undefined，从而导致JavaScript运行时抛出以上错误。那么怎样才能让WareComponent获得以上所描述的元数据呢？我们可以这样做：
```js
// 通过reflect-metadata中的Reflect为WareComponent定义名为design:paramtypes
// 、值为[WareService, CartService]的元数据
Reflect.defineMetadata('design:paramtypes', [WareService, CartService], WareComponent);

// 通过依赖注入器获取商品组件实例，并调用其addToCart()方法
let wareComponent = DependencyInjector.getService(WareComponent);
wareComponent.addToCart(); // 输出“已成功添加商品到购物车，目前商品库存：9；购物车商品数量：1。”
wareComponent.addToCart(); // 输出“已成功添加商品到购物车，目前商品库存：8；购物车商品数量：2。”
```

我们在使用依赖注入器之前，通过reflect-metadata中的Reflect的defineMetadata()方法为WareComponent定义了以上所描述的元数据。因此如果执行以上代码，那么我们将成功地得到相应的输出。然而，调用Reflect.defineMetadata()也不是一件轻松的事情，并且这看上去就容易出错。为了使事情轻松并且避免出错，TypeScript编译器（通过reflect-metadata）提供了对元数据的支持，而其支持的方式就是装饰器。装饰器是怎么支持元数据的呢？让我们继续定义这么一个类装饰器：

```js
// 类装饰器，其本质是函数
function Injectable(constructor: new (...args: any[]) => void): void {
}
```
接着让我们使用这个装饰器装饰商品组件类WareComponent：@Injectable // 类装饰器
```js
class WareComponent {
    // ... 省略的代码
}
```

然后再删除（或注释）Reflect.defineMetadata()的调用：

```
// 通过reflect-metadata中的Reflect为WareComponent定义名为design:paramtypes
// 、值为[WareService, CartService]的元数据
// Reflect.defineMetadata('design:paramtypes', [WareService, CartService], WareComponent);

// 通过依赖注入器获取商品组件实例，并调用其addToCart()方法
let wareComponent = DependencyInjector.getService(WareComponent);
wareComponent.addToCart(); // 输出“已成功添加商品到购物车，目前商品库存：9；购物车商品数量：1。”
wareComponent.addToCart(); // 输出“已成功添加商品到购物车，目前商品库存：8；购物车商品数量：2。”
```

现在如果我们执行以上代码，那么我们仍将得到期待的输出，但这是为什么呢？因为当TypeScript编译器发现WareComponent被类装饰器Injectable（这个名字可以被替换成其它任意合法的名字）装饰了时，TypeScript编译器会自动（通过reflect-metadata）为WareComponent定义名为“design:paramtypes”的元数据，并将这一元数据的值设置为WareComponent的构造函数的参数的构造函数组成的数组，即[WareService, CartService]。也就是说，类装饰器在TypeScript编译器和reflect-metadata的帮助下，自动地为目标类定义类名字为“design:paramtypes”、值为目标类的构造函数的参数的构造函数组成的数组的元数据——这句话有些拗口☹当然，除了以上自动行为，我们完全可以在类装饰器（比如以上Injectable）中写自己的代码，以向目标类中定义额外的元数据，或向目标类添加额外的属性，等等。最后，为了更加清晰地体验依赖注入器带来的方便，让我们继续创建一个Index类：

```js
// 定义并装饰Index类
@Injectable
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
```

你能猜到以上代码的运行结果吗？最最后，如果你打算在自己的VS Code中进行尝试的话，以下完整代码可供你参考：

```js
// 导入reflect-metadata
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

// 商品组件类
@Injectable // 类装饰器
class WareComponent {
    // 构造商品组件，依赖于商品服务和购物车服务
    constructor(private wareService: WareService, private cartService: CartService) {
    }

    // 添加商品的购物车：减少商品库存量，同时增加购物车商品数量
    addToCart(): void {
        this.wareService.decreaseStock();
        this.cartService.increaseWareCount();
        console.log(`已成功添加商品到购物车，目前商品库存：${this.wareService.stock}；购物车商品数量：${this.cartService.wareCount}。`);
    }
}

// 类装饰器
function Injectable(constructor: new (...args: any[]) => void): void {
}

// 依赖注入器类
abstract class DependencyInjector {
    /**
     * 获取指定类的对象
     * @param constructor 目标对象的类（的构造函数）
     */
    static getService<T>(constructor: new (...args: any[]) => T): T {
        // 获取类装饰器Injectable为目标类定义的名为“design:paramtypes”的元数据
        // 即目标类的构造函数的参数的构造函数组成的数组
        let paramtypes: any = Reflect.getMetadata('design:paramtypes', constructor);

        // 如果目标类上没有名为“design:paramtypes”的元数据
        // 那么直接返回通过这个类创建的对象
        if (!paramtypes || !paramtypes.length) {
            return new constructor();
        }

        // 需要传递给目标类的构造函数的参数数组
        let parameters: any[] = [];
        for (let parameterType of paramtypes) {
            // 递归调用当前方法，创建参数，并将参数添加到参数数组中
            let parameter: any = this.getService(parameterType);
            parameters.push(parameter);
        }

        // 使用参数数组构造目标对象，并将它返回给调用方
        return new constructor(...parameters);
    }
}

// 通过reflect-metadata中的Reflect为WareComponent定义名为design:paramtypes
// 、值为[WareService, CartService]的元数据
// Reflect.defineMetadata('design:paramtypes', [WareService, CartService], WareComponent);

// 通过依赖注入器获取商品组件实例，并调用其addToCart()方法
let wareComponent = DependencyInjector.getService(WareComponent);
wareComponent.addToCart();
wareComponent.addToCart();

// 定义并装饰Index类
@Injectable
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
```

以下是package.json文件的内容：
```js
{
    "author": {
        "name": "Lcng"
    },
    "version": "1.0.0",
    "dependencies": {
        "reflect-metadata": "latest"
    }
}
```
以下是tsconfig.json文件的内容：
```js
{
    "compilerOptions": {
        "module": "umd", // 生成符合CommonJS规范的JavaScript模块
        "moduleResolution": "node", // 使用Node.js的模块解析方式
        "target": "es2015", // 目标JavaScript版本
        "sourceMap": true, // 生成.js.map映射文件
        "skipLibCheck": true, // 不检查第三方包中的声明文件中的语法
        "experimentalDecorators": true, // 使用实验性功能
        "emitDecoratorMetadata": true, // 生成装饰器元数据
    }
}
```