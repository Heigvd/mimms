import { Heap } from "./heap";
import { Point, add, equalsStrict, sub } from "./point2D";

interface NodeProps {
	/**
	 * The id of the Node
	 */
	id: number;
	/**
	 * The position of the node
	 */
	position: Point;
	/**
	 * Is the node walkable or not
	 */
	walkable?: boolean;
}

/**
 * Class that implement a Node (or Vertex) for a pathfinding grid
 */
class Node {
	// General properties
	readonly id: number;
	readonly position: Point;
	private isWalkable: boolean;

	// Calculated weights
	private fValue: number;
	private gValue: number;
	private hValue: number | undefined;

	// Path finding algorithm data
	private parentNode: Node | undefined;
	private isOnClosedList: boolean;
	private isOnOpenList: boolean;

	public counter: number = 0;

	constructor(props: NodeProps) {
		this.id = props.id;
		this.position = props.position;
		this.isWalkable = props.walkable ? props.walkable : false;
		this.hValue = undefined;
		this.gValue = 0;
		this.fValue = 0;
		this.parentNode = undefined;
		this.isOnClosedList = false;
		this.isOnOpenList = false;
	}

	/**
	 * Calculate or Recalculate the F value
	 */
	private updateFValue(): void {
		this.fValue = this.gValue + (this.hValue ?? 0);
	}

	/**
	 * Set the g value of the node
	 */
	public setGValue(gValue: number): void {
		this.gValue = gValue;
		// The G value has changed, so recalculate the f value
		this.updateFValue();
	}

	/**
	 * Set the h value of the node
	 */
	public setHValue(hValue: number): void {
		this.hValue = hValue;
		// The H value has changed, so recalculate the f value
		this.updateFValue();
	}

	/**
	 * Reset the FGH values to zero
	 */
	public setFGHValuesToZero(): void {
		this.fValue = this.gValue = this.hValue = 0;
	}

	/**
	 * Compare two nodes
	 */
	public isEqual(node: Node) {
		return this.id === node.id;
	}

	/**
	 * Getter functions
	 */
	public getFValue(): number {
		return this.fValue;
	}

	public getGValue(): number {
		return this.gValue;
	}

	public getHValue(): number | undefined {
		return this.hValue;
	}

	public getParent(): Node | undefined {
		return this.parentNode;
	}

	public getIsOnClosedList(): boolean {
		return this.isOnClosedList;
	}

	public getIsOnOpenList(): boolean {
		return this.isOnOpenList;
	}

	public getIsWalkable(): boolean {
		return this.isWalkable;
	}

	/**
	 * Setter functions
	 */
	public setParent(parent: Node | undefined): void {
		this.parentNode = parent;
	}

	public setIsOnClosedList(isOnClosedList: boolean): void {
		this.isOnClosedList = isOnClosedList;
	}

	public setIsOnOpenList(isOnOpenList: boolean): void {
		this.isOnOpenList = isOnOpenList;
	}

	public setIsWalkable(isWalkable: boolean): void {
		this.isWalkable = isWalkable;
	}
}

interface GridProps {
	/**
	 * The matrix of the grid. Each cell has a density that is used to know if the corresponding node is walkable.
	 */
	matrix: number[][];
	/**
	 * The number of line in the matrix
	 */
	height: number;
	/**
	 * The number of cell in a line
	 */
	width: number;
	/**
	 * The default density thershold for obstacles.
	 * default is 0 so every matrix cell that has a higher number than 0 is considered as an obstacle.
	 */
	obstacleDensityThreshold?: number;
}

export class Grid {
	// General properties
	readonly width: number;
	readonly height: number;
	readonly numberOfFields: number;

	readonly obstacleDensityThreshold: number;
	readonly obstacleMatrix: number[][];

	// The node grid
	private gridNodes: Node[][];

	constructor(props: GridProps) {
		// Set the general properties
		this.width = props.width;
		this.height = props.height;
		this.numberOfFields = this.width * this.height;

		this.obstacleDensityThreshold = props.obstacleDensityThreshold || 0;
		this.obstacleMatrix = props.matrix;

		this.gridNodes = [];
	}

	/**
	 * Return a specific node.
	 */
	public getNodeAt(position: Point, debug: boolean = false): Node {

		let node: Node = (undefined as unknown) as Node; // can we do better ?
		if (this.isOnTheGrid(position)) {
			if (debug) wlog('position', position)
			if (this.gridNodes[position.y]) {
				node = this.gridNodes[position.y][position.x];
			} else {
				this.gridNodes[position.y] = []
			}
			if (!node) {
				if (debug) wlog('creating node at', position);
				//missing node, create it
				node = this.createNodeAt(position);
				this.gridNodes[position.y][position.x] = node;
			}
		}
		else if (debug) {
			wlog("Position outside of the grid", position);
		}

		return node;
	}

	private createNodeAt(p: Point): Node {
		const walkable = !this.obstacleMatrix[p.y][p.x] || this.obstacleMatrix[p.y][p.x] < this.obstacleDensityThreshold;
		return new Node({
			id: p.y * this.width + p.x,
			position: { x: p.x, y: p.y },
			walkable: walkable//this.obstacleMatrix[p.y][p.x] < this.obstacleDensityThreshold
		})
	}

	public nodeExists(p: Point): boolean {
		return this.isOnTheGrid(p) && this.gridNodes[p.y] && (this.gridNodes[p.y][p.x] ? true : false)
	}

	/**
	 * Check if specific node walkable.
	 */
	public isWalkableAt(position: Point, debug: boolean = false): boolean {
		const p = position;
		if(!this.isOnTheGrid(p)){
			return false;
		}
		return !this.obstacleMatrix[p.y][p.x] || this.obstacleMatrix[p.y][p.x] < this.obstacleDensityThreshold;
	}

	/**
	 * Check if specific node is on the grid.
	 */
	public isOnTheGrid(position: Point): boolean {
		return (
			position.x >= 0 &&
			position.x < this.width &&
			position.y >= 0 &&
			position.y < this.height
		);
	}

	public getCandidateNodes (current: Node, goal: Node, diagonalAllowed : boolean, useJumpPointSearch: boolean): Node[]{
		if(useJumpPointSearch){
			if(!diagonalAllowed) throw new Error('Jump search requires diagonals to be allowed. Either deactivate jump search or enable diagonals.')
			return this.getJumpNodes(current, goal);
		} else {
			return this.getSurroundingNodes(current.position, diagonalAllowed)
		}
	}

	/**
	 * Get direct surrounding nodes.
	 */
	private getSurroundingNodes(
		currentPosition: Point,
		diagnonalMovementAllowed: boolean
	): Node[] {
		const surroundingNodes: Node[] = [];

		for (var y = currentPosition.y - 1; y <= currentPosition.y + 1; y++) {
			for (var x = currentPosition.x - 1; x <= currentPosition.x + 1; x++) {
				if (x !== currentPosition.x || y !== currentPosition.y) {
					if (x == currentPosition.x || y == currentPosition.y || diagnonalMovementAllowed) {
						if (this.isOnTheGrid({ x, y }) && this.isWalkableAt({ x, y })) {							
							const node = this.getNodeAt({ x, y });
							if(!node.getIsOnClosedList()){
								surroundingNodes.push(node);
							}
						}
					}
				}
			}
		}

		return surroundingNodes;
	}

	/**
	 * Search candidates neighbors for the jump point search algorithm
	 */
	private getNaturalNeighbors(
		current: Node,
	): Point[] {
		const neighbors : Point[] = [];

		const parent = current.getParent();
		if(!parent){
			throw new Error('Node must have a parent');
		}

		const x = current.position.x;
		const y = current.position.y;

		const px = parent.position.x;
        const py = parent.position.y;
        // get the normalized direction of travel
        const dx = (x - px) / Math.max(Math.abs(x - px), 1);
        const dy = (y - py) / Math.max(Math.abs(y - py), 1);

        // search diagonally
        if (dx !== 0 && dy !== 0) {
            if (this.isWalkableAt({x, y: y + dy})) {
                neighbors.push({x, y: y + dy});
            }
            if (this.isWalkableAt({x:x + dx, y})) {
                neighbors.push({x :x + dx, y});
            }
            if (this.isWalkableAt({x:x + dx, y:y + dy})) {
                neighbors.push({x:x + dx, y:y + dy});
            }
			// turning points
            if (!this.isWalkableAt({x:x - dx, y})) {
                neighbors.push({x:x - dx, y:y + dy});
            }
            if (!this.isWalkableAt({x, y:y - dy})) {
                neighbors.push({x:x + dx, y:y - dy});
            }
        }
        // search horizontally/vertically
        else {

			if(this.isWalkableAt({x: x+dx, y: y+dy})){
				neighbors.push({x: x+dx, y: y+dy})
			}
			//turning points
			if(!this.isWalkableAt({x: x+dy, y: y-dx})){
				neighbors.push({x: x+dy+dx, y: y-dx+dy})
			}
			if(!this.isWalkableAt({x: x-dy, y: y+dx})){
				neighbors.push({x: x-dy+dx, y: y+dx+dy})
			}
        }
		return neighbors;
	}

	/**
	 * Computes jump neighbor candidates using the 'Jump Point Search' algorithm
	 * http://users.cecs.anu.edu.au/~dharabor/data/papers/harabor-grastien-aaai11.pdf
	 * https://zerowidth.com/2013/a-visual-explanation-of-jump-point-search.html
	 * https://harablog.wordpress.com/2011/09/07/jump-point-search/
	 */
	private getJumpNodes(current: Node, goal: Node): Node[]{

		if(!current.getParent()) // start node case
		{
			const directNeighbors = this.getSurroundingNodes(current.position, true);
			return directNeighbors;
		}
		
		const res: Node[] = [];
		// see jps algorithm for a definition of natural neighbor
		const naturalNeighbors = this.getNaturalNeighbors(current);
		
		for(let i = 0; i < naturalNeighbors.length; i++) {

			const n = naturalNeighbors[i];
			const dir = sub(n, current.position);
			const jumpPos = this.jump(current.position, dir, goal.position);
			if(jumpPos){
				res.push(this.getNodeAt(jumpPos));
			}
		}
		
		return res;
	}

	private jump(pos: Point, dir: Point, goal: Point): Point | undefined{

		const next = add(pos, dir);
		if(!this.isOnTheGrid(next) || !this.isWalkableAt(next))
		{
			return undefined;
		}
		if(equalsStrict(next, goal)){
			return next;
		}
		if(this.hasForcedNeighbors(next, dir)){
			return next;
		}
		if(dir.x != 0 && dir.y != 0){// diagonal case
			const horiz = {x: dir.x, y : 0};
			const vert = {x : 0, y : dir.y};
			// look if there are point of interest along vertical or horizontal directions
			if(this.jump(next, horiz, goal) || this.jump(next, vert, goal)){
				return next;
			}
		}
		return this.jump(next, dir, goal);
	}

	/**
	 * See jump point search algorithm for definition of forced neighbor
	 */
	private hasForcedNeighbors(pos: Point, dir: Point): boolean {

		if(dir.x === 0 || dir.y === 0) { // cardinal direction case
			//blocked on the left when looking at dir
			const left = {x: pos.x + dir.y, y: pos.y - dir.x }
			const leftDiag = add(left, dir);
			if(this.isOnTheGrid(left) && !this.isWalkableAt(left) 
				&& this.isOnTheGrid(leftDiag) && this.isWalkableAt(leftDiag)){
				return true;
			}
			// block on the right when looking at dir
			const right = {x: pos.x - dir.y, y: pos.y + dir.x }
			const rightDiag = add(right, dir);
			if(this.isOnTheGrid(right) && !this.isWalkableAt(right) 
				&& this.isOnTheGrid(rightDiag) && this.isWalkableAt(rightDiag)){
				return true;
			}

		}else { // diagonals case
			// case horizontal: suppose blocking node is an horizontal neighbor
			const blockH = {x : pos.x - dir.x, y: pos.y};
			const freeH = {x: blockH.x, y: blockH.y + dir.y};

			if(this.isOnTheGrid(blockH) && this.isOnTheGrid(freeH)
				&& !this.isWalkableAt(blockH) && this.isWalkableAt(freeH))
			{
				return true;
			}

			// case vertical: suppose blocking node is a vertical neighbor
			const blockV = {x : pos.x, y: pos.y - dir.y};
			const freeV = {x: blockV.x + dir.x, y: blockH.y};

			if(this.isOnTheGrid(blockV) && this.isOnTheGrid(freeV)
				&& !this.isWalkableAt(blockV) && this.isWalkableAt(freeV))
			{
				return true;
			}

		}
		return false;
	}

	/**
	 * Transfor the node grid into a visual matrix with · for allowed cell and X for obstacles
	 */
	public gridToMatrix(): string[][] {
		return this.gridNodes.map(line => line.map(node =>
			node ? (node.getIsWalkable() ? "·" : "X") : '!'))
	}

	/**
	 * Log a visual of a matrix (don't work with grid bigger than 10x10)
	 */
	public static drawGrid(matrix: (number | string)[][]) {
		if (matrix.length > 0 && matrix.length <= 10 && matrix[0].length > 0 && matrix[0].length <= 10) {
			wlog("+-" + matrix.map(() => "-").join("-") + "-+\n"
				+ matrix.map((line) => "| " + line.join(" ") + " |").join("\n")
				+ "\n+-" + matrix.map(() => "-").join("-") + "-+");
		}
		else {
			wlog("Matrix too big to be displayed!")
		}
	}
}


/**
 * Heuristics that can be used to calculate distances
 */
type Heuristic =
	| 'Manhattan'
	| 'Euclidean'
	| 'EuclideanSq'
	| 'Chebyshev'
	| 'Octile';

/**
 * Algorithms that can be used for path finding
 */
export type Algorithm = "AStar" | "AStarSmooth" | "ThetaStar";

interface PathFinderProps {
	grid: GridProps;
	diagonalAllowed?: boolean;
	heuristic?: Heuristic;
	includeStartNode?: boolean;
	includeEndNode?: boolean;
	cellSize: number;
	offsetPoint: Point;
	useJumpPointSearch?: boolean;
}

/**
 * A class that implements AStar and ThetaStar pathfinding algorithm
 * 
 * based on :
 * AStar : AI for Games, Third Edition, 3rd Edition, Ian Millington, ISBN: 9781351053280
 * ThetaStar : Theta*: Any-Angle Path Planning on Grids, Kenny Daniel & Alex Nash & Sven Koenig & Ariel Felner, Journal of Artificial Intelligence Research 39 (2010) 533-579
 * 
 * APThetaStar is not implemented. It would guarantee a shortest path but at the cost of a higher computation load.
 * The performance increase for APTheta implementation is not worth it.
 */
export class PathFinder {
	// World values
	private cellSize: number;
	private offsetPoint: Point;

	public counter : number = 0;

	// Grid
	public grid: Grid;

	// Lists
	public openList: Heap<Node>;

	// Pathway variables
	readonly diagonalAllowed: boolean;
	public readonly heuristic: Heuristic;
	readonly includeStartNode: boolean;
	readonly includeEndNode: boolean;

	readonly useJumpPointSearch: boolean;

	constructor(props: PathFinderProps) {
		// Create grid
		this.grid = new Grid(props.grid);

		// init min-heap to extract minimum value
		this.openList = new Heap((a,b) => a.getFValue() <= b.getFValue());

		// Set diagonal boolean
		this.diagonalAllowed = props.diagonalAllowed ?? false;

		// Use smart pruning and jump neighbors
		this.useJumpPointSearch = props.useJumpPointSearch ?? false;

		// Set heuristic function
		this.heuristic = props.heuristic ?? (props.diagonalAllowed ? 'Octile' : 'Manhattan');

		// Set if start node included
		this.includeStartNode =
			props.includeStartNode !== undefined ? props.includeStartNode : true;

		// Set if end node included
		this.includeEndNode =
			props.includeEndNode !== undefined ? props.includeEndNode : true;

		// Set world values
		this.cellSize = props.cellSize;
		this.offsetPoint = props.offsetPoint;
	}

	// evaluate shortest distance using cardinal directions
	// .98 to be just a little pessimitic in the heuristic
	private octileVal = 2 - Math.SQRT2;
	private octileValHeuristic = this.octileVal* 0.98;
	/**
	 * Calculate weighted distance with the selected heuristic
	 */
	private calculateHeuristicDistance(
		heuristicFunction: Heuristic,
		pos0: Point,
		pos1: Point,
	): number {
		const dx = Math.abs(pos1.x - pos0.x);
		const dy = Math.abs(pos1.y - pos0.y);

		switch (heuristicFunction) {
			case 'Manhattan':
				return dx + dy;
			case 'Euclidean':
				return Math.sqrt(dx * dx + dy * dy);
			case 'EuclideanSq':
				return dx * dx + dy * dy;
			case 'Chebyshev':
				return Math.max(dx, dy);
			case 'Octile':
				return dx + dy - this.octileValHeuristic * Math.min(dx, dy);
		}
	}

	/**
	 * Find path by visiting the graph
	 */
	private _findPath(startPosition: Point, endPosition: Point, algorithm: Algorithm): Point[] {

		// Select vertex updater function
		let updateVertexFN: (s0: Node, s1: Node) => void;
		switch (algorithm) {
			case "AStar":
			case "AStarSmooth":
				updateVertexFN = this.AStartUpdateVertex.bind(this);
				break;
			case "ThetaStar":
			default:
				updateVertexFN = this.ThetaStarUpdateVertex.bind(this);
		}

		// Reset lists
		this.openList.clear();

		const startNode = this.grid.getNodeAt(startPosition, true);
		const endNode = this.grid.getNodeAt(endPosition);

		// Break if start and/or end position is/are not walkable
		if (
			!this.grid.isWalkableAt(endPosition) ||
			!this.grid.isWalkableAt(startPosition)
		) {
			// Path could not be created because the start and/or end position is/are not walkable.
			return [];
		}

		// Push start node into open list
		startNode.setIsOnOpenList(true);
		this.openList.insert(startNode);

		// As long the open list is not empty, continue searching a path
		while (!this.openList.isEmpty()) {

			//get node with minimum f value
			const currentNode = this.openList.extract();
			currentNode.setIsOnOpenList(false);

			currentNode.setIsOnClosedList(true);

			// for debug ordering
			//currentNode.counter = ++this.counter;

			// End of path is reached
			if (currentNode === endNode) {
				const path = this.backtrace(endNode, this.includeStartNode, this.includeEndNode);
				wlog('Explored nodes', this.counter)
				if (algorithm === "AStarSmooth") {
					return this.smoothPath(path)
				}
				else {
					return path;
				}
			}

			// Get neighbors
			const neighbors = this.grid.getCandidateNodes(
				currentNode,
				endNode,
				this.diagonalAllowed,
				this.useJumpPointSearch
			);
			const neighIteration = ++this.counter;

			// Loop through all the neighbors
			for (let i in neighbors) {
				const neighbor = neighbors[i];
				neighbor.counter = neighIteration;
				// Continue if node on closed list
				if (neighbor.getIsOnClosedList()) {
					continue;
				}

				if (neighbor.getHValue() == null) {
					//compute H value
					neighbor.setHValue(
						this.calculateHeuristicDistance(
							this.heuristic,
							neighbor.position,
							endNode.position,
							//this.weight
						)
					);
				}

				updateVertexFN(currentNode, neighbor);
			}
		}
		// Path could not be created
		return [];
	}


	/**
	 * Compute the path from the Node and return a path of points.
	 * Get parents recursively until the start of the path
	 */
	private backtrace(
		node: Node,
		includeStartNode: boolean,
		includeEndNode: boolean,
	): Point[] {
		// Init empty path
		const path: Point[] = [];

		let currentNode: Node;
		if (includeEndNode) {
			// Attach the end node to be the current node
			currentNode = node;
		} else {
			const parentNode = node.getParent();
			if (parentNode == null) {
				throw Error("Missing parent node");
			}
			currentNode = parentNode;
		}


		// Loop as long the current node has a parent
		while (currentNode.getParent()) {
			path.push(currentNode.position);
			currentNode = currentNode.getParent()!;
		}

		// If true we will also include the starting node
		if (includeStartNode) {
			path.push(currentNode.position);
		}

		return path.reverse();
	}

	/**
	 * Check if there is an obstacle between two points
	 */
	private gridLOS(start: Point, end: Point, debug: boolean = false): boolean {

		if (debug) {
			wlog("Start: ", start);
			wlog("End: ", end);
			//const nodeGrid = this.grid.getGridNodes();
			if (!this.grid.isOnTheGrid(start) || !this.grid.isOnTheGrid(end)) {
				//(nodeGrid.length < start.y || nodeGrid.length < end.y
				//|| nodeGrid[0]?.length < start.x || nodeGrid[0]?.length < end.x) {
				wlog("Start or end point outside of the grid");
			}
			else {
				const newGrid = this.grid.gridToMatrix();
				newGrid[start.y][start.x] = "A";
				newGrid[end.y][end.x] = "B"
				Grid.drawGrid(newGrid);
			}
		}

		let x0 = start.x;
		let y0 = start.y;
		let x1 = end.x;
		let y1 = end.y;

		let dX = x1 - x0;
		let dY = y1 - y0;
		let sX = 1;
		let sY = 1;

		if (dY < 0) {
			dY = -dY
			sY = -1;
		}
		if (dX < 0) {
			dX = -dX
			sX = -1;
		}
		const testNode = (point: Point): boolean => {
			if (debug) {
				wlog("Test Node ", point);
			}
			return this.grid.isWalkableAt(point, debug);
		}

		if (dX >= dY) {
			// how many x cells for one vertical cell ?
			const pDx = dX / dY;

			// pattern starts at the middle of the first cell
			let cDx = pDx / 2;

			while (x0 !== x1) {
				const diff = Math.abs(cDx - pDx - 0.5)
				
				if (diff > 0.00001 && !testNode({ x: x0, y: y0 })) {
					return false;
				}
				if (
					dY > 0 &&
					(cDx >= pDx || // LOS moved to next line after start of current column
					pDx - cDx < 0.5) //  LOS will move to next line before next column
				) 
				{
					// move to next line now
					y0 += sY;
					cDx -= pDx;

					if (!testNode({ x: x0, y: y0 })) {
						return false;
					}
					
				}
				// Move to next column
				cDx += 1;
				x0 += sX;
			}
		}
		else {
			// how many y cells for one h cell ?
			const pDy = dY / dX;

			// pattern starts at the middle of the first cell
			let cDy = pDy / 2;

			while (y0 !== y1) {
				const diff = Math.abs(cDy - pDy - 0.5)

				if ( diff > 0.0001 && !testNode({ x: x0, y: y0 })) {
					return false;
				}
				if (
					dX > 0 &&
					(cDy >= pDy || // LOS moved to next column after start of current line
					pDy - cDy < 0.5) //  LOS will move to next column before next line
				) 
				{
					// move to next column now
					x0 += sX;
					cDy -= pDy;

					if (!testNode({ x: x0, y: y0 })) {
						return false;
					}
				}
				// Move to next column
				cDy += 1;
				y0 += sY;
			}
		}
		return true;
	}

	public static testLOS() {
		const grid = [
			[0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0],
			[0, 0, 1, 0, 0],
			[0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0],
		]

		const pathFinder = new PathFinder({
			grid: {
				height: 5,
				width: 5,
				matrix: grid
			},
			cellSize: 1,
			offsetPoint: { x: 0, y: 0 },
			useJumpPointSearch: false
		});

		Grid.drawGrid(grid)

		/*
				wlog("===================================================");
				wlog("true", "[0;0]->[0;4]", pathFinder.gridLOS({ x: 0, y: 0 }, { x: 0, y: 4 }));
				wlog("true", "[0;0]->[4;0]", pathFinder.gridLOS({ x: 0, y: 0 }, { x: 4, y: 0 }));
				wlog("true", "[0;0]->[0;3]", pathFinder.gridLOS({ x: 0, y: 0 }, { x: 0, y: 3 }));
				wlog("true", "[0;0]->[3;0]", pathFinder.gridLOS({ x: 0, y: 0 }, { x: 3, y: 0 }));
		
				wlog("===================================================");
				wlog("false", "[0;0]->[4;4]", pathFinder.gridLOS({ x: 0, y: 0 }, { x: 4, y: 4 }));
				wlog("false", "[0;0]->[2;4]", pathFinder.gridLOS({ x: 0, y: 0 }, { x: 2, y: 4 }));
				wlog("false", "[0;0]->[4;2]", pathFinder.gridLOS({ x: 0, y: 0 }, { x: 4, y: 2 }));
				wlog("false", "[0;0]->[4;2]", pathFinder.gridLOS({ x: 0, y: 0 }, { x: 4, y: 2 }));
				wlog("false", "[1;0]->[4;2]", pathFinder.gridLOS({ x: 1, y: 0 }, { x: 4, y: 2 }));
				wlog("false", "[0;1]->[4;2]", pathFinder.gridLOS({ x: 0, y: 1 }, { x: 4, y: 3 }));
				*/

		wlog("false", "[0;0]->[4;2]", pathFinder.gridLOS({ x: 0, y: 0 }, { x: 4, y: 2 }, true));

	}

	/**
	 * Smooth the path by linking points that can "see" eachothers
	 */
	public smoothPath(path: Point[]): Point[] {
		if (path.length < 3) {
			return path;
		}

		let tK = path[0];
		const smoothedPath = [tK];

		for (let i = 0; i < path.length - 1; ++i) {
			if (!this.gridLOS(tK, path[i + 1])) {
				tK = path[i];
				smoothedPath.push(path[i]);
			}
		}
		smoothedPath.push(path[path.length - 1]);
		return smoothedPath;
	}

	/**
	 * Find path between two points by visiting the graph
	 * Take world coordinate and return path in world coordinate 
	 */
	public findPath(startWorldPosition: Point, endWorldPosition: Point, algorithm: Algorithm = "ThetaStar"): Point[] {
		// Translate into grid points
		const startPosition = PathFinder.worldPointToGridPoint(startWorldPosition, this.cellSize, this.offsetPoint)
		const endPosition = PathFinder.worldPointToGridPoint(endWorldPosition, this.cellSize, this.offsetPoint)

		// Compute path
		const path = this._findPath(startPosition, endPosition, algorithm);

		// Translate back into world point and return
		return this.toWorldPath(path);
	}

	/** 
	 * Translate path in grid coordinates into world coordinates
	 */
	private toWorldPath(path: Point[]): Point[] {
		return path.map(point => PathFinder.gridPointToWorldPoint(point, this.cellSize, this.offsetPoint));
	}

	/**
	 * AStar and thetaStar update vertex algorithm implementation
	 * @param currentNode currently evaluated node
	 * @param neighbor candiate node to be updated
	 * @param distance computed cost to from current to neighbor
	 */
	private UpdateVertex(currentNode: Node, neighbor: Node, distance: number) {
		// Calculate the g value of the neighbor
		const nextGValue = currentNode.getGValue() + distance

		// Is the neighbor not on open list OR
		// can it be reached with lower g value from current position
		if (
			!neighbor.getIsOnOpenList() ||
			nextGValue < neighbor.getGValue()
		) {
			neighbor.setGValue(nextGValue);
			neighbor.setParent(currentNode);

			if (!neighbor.getIsOnOpenList()) {
				neighbor.setIsOnOpenList(true);
				this.openList.insert(neighbor);
			}
		}
	}

	/**
	 * Computes octile distance
	 * That is, distance from two points on a grid using
	 * only cardinal and direct diagonal moves
	 */
	private ComputeNeighborDistance(current: Node, neighbor: Node): number {
		// Octile will calculate the length of any path from a to b
		// using only the 8 possible directions
		// it thus solves all cases of direct neighbors and jump neighbors
		
		const dx = Math.abs(current.position.x - neighbor.position.x);
		const dy = Math.abs(current.position.y - neighbor.position.y);
		
		return dx + dy - this.octileVal * Math.min(dx, dy);
	
	}

	/**
	 * Euclidian distance
	 */
	private ComputeEuclidianDistance(current: Node, target: Node): number {
		const dx = Math.abs(current.position.x - target.position.x);
		const dy = Math.abs(current.position.y - target.position.y);
		return Math.sqrt(dx * dx + dy * dy);
	}


	/**
	 * AStar Update vertex algorithm implementation
	 */
	private AStartUpdateVertex(currentNode: Node, neighbor: Node) {
		this.UpdateVertex(currentNode, neighbor, this.ComputeNeighborDistance(currentNode, neighbor));
	}
	
	/**
	 * ThetaStar Update vertex algorithm implementation
	 */
	private ThetaStarUpdateVertex(currentNode: Node, neighbor: Node) {
		const currentParent = currentNode.getParent();
		//test if possible to bypass current node
		if (currentParent != null && this.gridLOS(currentParent.position, neighbor.position)) {
			this.UpdateVertex(currentParent, neighbor, this.ComputeEuclidianDistance(currentParent, neighbor))
		}
		else {
			this.UpdateVertex(currentNode, neighbor, this.ComputeNeighborDistance(currentNode, neighbor));
		}
	}


	/* find all points loacated at exactlly nCells from the given center.
   * Diagonals allowed, diag counts as 1 cell
   */
  private findPointsAtDistance(center: Point, nCells: number): Point[] {
    if (nCells === 0){
      return [center];
    }

    const points: Point[] = [];

    const xMin = center.x - nCells;
    const xMax = center.x + nCells;

    const yMin = center.y - nCells;
    const yMax = center.y + nCells;

    // Top anb bottom lines
    for (let x = xMin; x <= xMax; x++) {
      points.push({x, y: yMin}, {x, y: yMax});
    }

    // left and right lines
    for (let y = yMin+1; y < yMax; y++) {
      points.push({x: xMin, y}, {x: xMax, y});
    }

    return points;
  }

  /*
   * Find the nearest point without obstacle
   */
  public findNearestWalkablePoint(worldPoint: Point): Point | undefined {
    const gridPosition = PathFinder.worldPointToGridPoint(worldPoint, this.cellSize, this.offsetPoint);

    for (let distance = 0; distance< 5;distance++){
      const points = this.findPointsAtDistance(gridPosition, distance);
      for (let point of points){
        if (this.getGrid().isWalkableAt(point)){
          return PathFinder.gridPointToWorldPoint(point, this.cellSize, this.offsetPoint);
        }
      }
    }
  }

	// Getter methods

	public getGrid(): Grid {
		return this.grid;
	}

	// Static methods
	/**
	 * Translate grid coordinate to world coordinate
	 */
	public static gridPointToWorldPoint(
		cell: Point,
		cellSize: number,
		offsetPoint: Point,
	): Point {
		return {
			x: cell.x * cellSize + offsetPoint.x + cellSize /2,
			y: cell.y * cellSize + offsetPoint.y + cellSize / 2,
		}
	}

	/**
	 * Translate world coordinate to grid coordinate
	 */
	public static worldPointToGridPoint(
		point: Point,
		cellSize: number,
		offsetPoint: Point,
	): Point {
		return {
			x: Math.floor((point.x - offsetPoint.x) / cellSize),
			y: Math.floor((point.y - offsetPoint.y) / cellSize),
		}
	}
}
