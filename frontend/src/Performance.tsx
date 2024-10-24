class Performance {
    private start: number;

    constructor() {
        this.start = 0;
    }

    a(): void {
        this.start = new Date().getTime();
    }

    z(): void {
        console.log(new Date().getTime() - this.start);
    }
}

const performance = new Performance();
export default performance;
