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

export default DependencyInjector