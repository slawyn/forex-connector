
class Performance {

    constructor(){
        this.start = 0
    }

    a() {
        this.start = new Date().getTime()
    }
    z(){
        console.log(new Date().getTime() - this.start)
    }
}

const performance = new Performance();
export default performance;