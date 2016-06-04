export class Player {
    constructor (name, position)
    {
        this.name = name
        this.position = position
        this.bank = 0
    }

    addMoney(amount){
        this.bank += amount
    }

    loseMoney(amount){
        this.bank -= amount;
    }

}