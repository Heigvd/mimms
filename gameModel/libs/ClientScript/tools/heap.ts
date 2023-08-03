/**
 * Heap data structure. 
 * insertion in log(N)
 * extract "first" element with regard to a provided comparison function. log(N) complexity
 */
export class Heap<T> {

	readonly compFunc: ((a: T, b: T) => boolean);
	data : T[];

	/**
	 * @param function that returns true when element A should precede element B
	 * Ideally should return true if A is equivalent to B for performance reasons
	 *
	 * for all values in the heap
	 */
	constructor(comparison: ((a: T, b: T) => boolean)){
		this.compFunc = function (x: T, y :T) {

			if(x === undefined || y === undefined){
				return true; // heap is consistent
			}else{
				return comparison(x,y);
			}
		};

		this.data = [];
	}

	/**
	 * returns the element E that satisfies comparison(E, X)
	 * without removing it
	 * for any other element X in the heap
	 */
	peek(): T | undefined {
		if(this.data[0]){
			return this.data[0];
		}else {
			return undefined;
		}
	}

	/**
	 * returns the element E that satisfies comparison(E, X)
	 * for any other element X in the heap
	 * log(N) complexity
	 */
	extract(): T | undefined {
		if(this.data.length < 1) return undefined;

		const res : T = this.data[0]!;
		const last = this.data.pop()!;

		if(this.data.length > 0){
			this.data[0] = last;
			this.heapDown(0);
		}

		return res;
	}

	/**
	 * Insert element. log(N) complexity
	 */
	insert(t: T): void {
		const length = this.data.push(t);
		this.heapUp(length-1);
	}

	isEmpty(): boolean{
		return this.data.length < 1;
	}

	size(): number {
		return this.data.length;
	}

	clear(){
		this.data = [];
	}

	private heapDown(idx : number){
		if(idx >= this.data.length - 1)
			return; // we reached the end of the heap

		const [left, right] = this.getChildren(idx);
		let candidate = -1;

		if(this.exists(left)){
			if(this.exists(right)){
				candidate = this.compFunc(this.data[left]!, this.data[right]!) ? left: right;
			}else {
				candidate = left;
			}
		} // if left doesn't exist, right does not exist by heap construction

		if(candidate > 0){
			if(!this.compFunc(this.data[idx]!, this.data[candidate]!)){
				this.swap(idx, candidate);
				this.heapDown(candidate);
			}
		}
	}

	private heapUp(idx: number){
		if(idx <= 0)
			return;

		const p = this.getParent(idx);
		if(!this.compFunc(this.data[p]!, this.data[idx]!)){
			this.swap(idx, p);
			this.heapUp(p);
		}
	}

	private swap(i: number, j: number){
		const tmp = this.data[i]!;
		this.data[i] = this.data[j]!;
		this.data[j] = tmp;
	}

	private getChildren(idx: number): [number, number] {
		return [idx*2+1, idx*2+2];
	}

	private getParent(idx: number): number {
		return (idx-1)>>1;
	}

	private exists(idx: number): boolean {
		return idx < this.data.length;
	}
}

/*
export function test1(){
	const values = [7,5,86,3,4,24,23,6,8,4,2,5,332,34,5,3,4,2,3,554,2,45];

	const minHeap = new Heap((x:number,y: number) => x <= y);

	for(let i = 0; i < values.length; i++){
		minHeap.insert(values[i]!);
	}

	for(let i = 0; i < values.length; i++){
		wlog(minHeap.extract());
	}
	wlog('peek empty ', minHeap.peek());
	wlog('extract while empty: should be undefined', minHeap.extract());

}
*/