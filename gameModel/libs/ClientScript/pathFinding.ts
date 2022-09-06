import { Heap } from "./heap";
import { Segment } from "./helper";
import { DiscreteExtent, ObstacleType } from "./layersData";
import { pathFindingLogger } from "./logger";
import { Point, add, equalsStrict, sub, lengthSquared } from "./point2D";


/**
 * Class that implement a Node (or Vertex) for a pathfinding grid
 */
class Node {
	// General properties
	//readonly id: number;
	readonly position: Point;
	//private isWalkable: boolean;

	// Calculated weights
	private fValue: number;
	private gValue: number;
	private hValue: number | undefined;

	// Path finding algorithm data
	private parentNode: Node | undefined;
	private isOnClosedList: boolean;
	private isOnOpenList: boolean;

	public counter: number = 0;

	constructor(position: Point) {
		this.position = position;
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
		this.fValue = this.gValue = 0;
		this.hValue = undefined;
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
	obstacleDensityThreshold?: ObstacleType;
}

export class Grid {
	// General properties
	readonly width: number;
	readonly height: number;
	/**
	 * max number of nodes
	 * width * height
	 */
	readonly nodeMax: number;

	readonly obstacleDensityThreshold: number;
	readonly obstacleMatrix: number[][];

	// The node grid
	private gridNodes: Node[][];

	private nodeCount: number = 0;

	constructor(props: GridProps) {
		// Set the general properties
		this.width = props.width;
		this.height = props.height;
		this.nodeMax = this.width * this.height;

		this.obstacleDensityThreshold = props.obstacleDensityThreshold || ObstacleType.NonWalkable;
		this.obstacleMatrix = props.matrix;

		this.gridNodes = [];
	}

	/**
	 * Gets the number of instantiated nodes
	 */
	public getNodeCount(): number {
		return this.nodeCount;
	}

	public resetExistingNodes(){
		for(const n of this.nodeCache){
			n.setIsOnClosedList(false);
			n.setIsOnOpenList(false);
			n.setParent(undefined);
			n.setFGHValuesToZero();
		}
	}

	/**
	 * Return a specific node.
	 */
	public getNodeAt(position: Point, debug: boolean = false): Node | undefined {

		let node: Node | undefined = undefined;

		if (this.isOnTheGrid(position)) {
			if (debug) pathFindingLogger.debug('position', position)
			if (this.gridNodes[position.y]) {
				node = this.gridNodes[position.y]![position.x]!;
			} else {
				this.gridNodes[position.y] = []
			}
			if (!node) {
				if (debug) pathFindingLogger.debug('creating node at', position);
				//missing node, create it
				node = this.createNodeAt(position);
				//this.nodeCache.push(node);
				this.gridNodes[position.y]![position.x] = node;
			}
		}
		else if (debug) {
			pathFindingLogger.debug("Position outside of the grid ", position, this.width, this.height);
		}

		return node;
	}

	private nodeCache : Node[] = [];

	private createNodeAt(p: Point): Node {
		this.nodeCount++;
		return new Node(p);
	}

	public nodeExists(p: Point): boolean {
		return this.isOnTheGrid(p) && this.gridNodes[p.y] != null && (this.gridNodes[p.y]![p.x] ? true : false)
	}

	/**
	 * Check if specific node walkable.
	 */
	public isWalkableAt(p: Point): boolean {
		return this.isWalkableAtXY(p.x, p.y);
	}
	
	/**
	 * Warning : this function is performance critical, 
	 * it is often called more than 1000'000 times for each search
	 */
	public isWalkableAtXY(x: number, y: number): boolean {
		if (!this.isOnTheGridXY(x,y)) {
			return false;
		}
		return this.obstacleMatrix[y][x] < this.obstacleDensityThreshold;
	}

	public walkabilityValue(position: Point): number {
		const p = position;
		if (!this.isOnTheGrid(p)) {
			return -1;
		}
		const obstacle = this.obstacleMatrix[p.y] ? this.obstacleMatrix[p.y]![p.x] : undefined;
		return obstacle || 0;
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

	public isOnTheGridXY(x: number, y: number): boolean {
		return (
			x >= 0 &&
			x < this.width &&
			y >= 0 &&
			y < this.height
		);
	}

	public getCandidateNodes(current: Node, goal: Node, diagonalAllowed: boolean, useJumpPointSearch: boolean): Node[] {
		if (useJumpPointSearch) {
			if (!diagonalAllowed) throw new Error('Jump search requires diagonals to be allowed. Either deactivate jump search or enable diagonals.')
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
							if (!node?.getIsOnClosedList()) {
								surroundingNodes.push(node!);
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
		const neighbors: Point[] = [];

		const parent = current.getParent();
		if (!parent) {
			throw new Error('Node must have a parent');
		}

		const x = current.position.x;
		const y = current.position.y;

		const px = parent.position.x;
		const py = parent.position.y;
		// get the normalized direction of travel
		const dx = (x - px) / Math.max(Math.abs(x - px), 1);
		const dy = (y - py) / Math.max(Math.abs(y - py), 1);

		// search horizontally/vertically
		if(dx === 0 || dy === 0){
			if (this.isWalkableAtXY(x + dx, y + dy)) {
				neighbors.push({ x: x + dx, y: y + dy })
			}
			// turning points
			if (!this.isWalkableAtXY(x + dy, y - dx )) {
				neighbors.push({ x: x + dy + dx, y: y - dx + dy })
			}
			if (!this.isWalkableAtXY( x - dy, y + dx)) {
				neighbors.push({ x: x - dy + dx, y: y + dx + dy })
			}
		} else { // search diagonally
			if (this.isWalkableAtXY(x,y + dy )) {
				neighbors.push({ x, y: y + dy });
			}
			if (this.isWalkableAtXY( x + dx, y )) {
				neighbors.push({ x: x + dx, y });
			}
			if (this.isWalkableAtXY( x + dx, y + dy)) {
				neighbors.push({ x: x + dx, y: y + dy });
			}
			// turning points
			if (!this.isWalkableAtXY( x - dx, y )) {
				neighbors.push({ x: x - dx, y: y + dy });
			}
			if (!this.isWalkableAtXY( x, y - dy )) {
				neighbors.push({ x: x + dx, y: y - dy });
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
	private getJumpNodes(current: Node, goal: Node): Node[] {

		if (!current.getParent()) // start node case
		{
			return this.getSurroundingNodes(current.position, true);
		}

		const res: Node[] = [];
		// see jps algorithm for a definition of natural neighbor
		const naturalNeighbors = this.getNaturalNeighbors(current);

		for (let i = 0; i < naturalNeighbors.length; i++) {

			const n = naturalNeighbors[i]!;
			const dir = sub(n, current.position);
			const jumpPos = this.jump(current.position, dir, goal.position);
			if (jumpPos) {
				const node = this.getNodeAt(jumpPos);
				if (node) {
					res.push(node);
				}
			}
		}

		return res;
	}

	private jump(pos: Point, dir: Point, goal: Point): Point | undefined {

		if (!this.isWalkableAtXY(pos.x + dir.x, pos.y + dir.y)) {
			return undefined;
		}

		const next = {x: pos.x + dir.x, y : pos.y + dir.y};

		if (next.x === goal.x && next.y === goal.y) {
			return next;
		}

		if(this.hasForcedNeighbors(next, dir)){
			return next;
		}
		if (dir.x != 0 && dir.y != 0) {// diagonal case
			// search for points of interest along vertical or horizontal directions
			if (this.jump(next, { x: dir.x, y: 0 }, goal) || this.jump(next, { x: 0, y: dir.y }, goal)) {
				return next;
			}
		}
		return this.jump(next, dir, goal);
	}

	/**
	 * See jump point search algorithm for definition of forced neighbor
	 * Warning : this function is performance critical, 
	 * it is often called more than 1000'000 times for each search
	 */
	private hasForcedNeighbors(pos: Point, dir: Point): boolean {

		// commented lines are left for code readability
		// but manually inlined
		if (dir.x === 0 || dir.y === 0) { // cardinal direction case
			//blocked on the left when looking in dir direction
			//const left = { x: pos.x + dir.y, y: pos.y - dir.x }
			//const leftDiag = add(left, dir);
			if (!this.isWalkableAtXY(pos.x + dir.y, pos.y - dir.x) 
				&& this.isWalkableAtXY(pos.x + dir.y + dir.x, pos.y - dir.x + dir.y)) {
				return true;
			}
			// block on the right when looking in dir direction
			//const right = { x: pos.x - dir.y, y: pos.y + dir.x }
			//const rightDiag = add(right, dir);
			if (!this.isWalkableAtXY(pos.x - dir.y, pos.y + dir.x) 
				&& this.isWalkableAtXY(pos.x - dir.y + dir.x, pos.y + dir.x + dir.y)) {
				return true;
			}

		} else { // diagonals case
			// case horizontal: suppose blocking node is an horizontal neighbor
			//const blockH = { x: pos.x - dir.x, y: pos.y };
			//const freeH = { x: blockH.x, y: blockH.y + dir.y };

			if (!this.isWalkableAtXY(pos.x - dir.x, pos.y) 
				&& this.isWalkableAtXY(pos.x - dir.x, pos.y + dir.y)) {
				return true;
			}

			// case vertical: suppose blocking node is a vertical neighbor
			//const blockV = { x: pos.x, y: pos.y - dir.y };
			//const freeV = { x: blockV.x + dir.x, y: blockV.y };

			if (!this.isWalkableAtXY(pos.x, pos.y - dir.y) 
				&& this.isWalkableAtXY(pos.x + dir.x, pos.y - dir.y)) {
				return true;
			}

		}
		return false;
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

export interface PathFinderProps {
	grid: GridProps;
	diagonalAllowed?: boolean;
	heuristic?: Heuristic;
	cellSize: number;
	offsetPoint: Point;
	useJumpPointSearch?: boolean;
	/**
	 * Stop condition.
	 * If more than this ratio of nodes is covered.
	 * The search stops and an empty path is returned.
	 * defaults to 1 (deactivated)
	 */
	maxCoverageRatio?: number;
	/**
	 * Stop condition.
	 * Search stops after this time has elapsed
	 */
	maxComputationTimeMs?: number;
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

	public counter: number = 0;

	// Grid
	public grid: Grid;

	// Lists
	public openList: Heap<Node>;

	// Pathway variables
	readonly diagonalAllowed: boolean;
	public readonly heuristic: Heuristic;

	readonly useJumpPointSearch: boolean;
	
	readonly nodeCoverageLimit: number

	/**
	 * Stop condition.
	 * Search stops after this time has elapsed
	 */
	readonly maxComputationTimeMs: number;

	constructor(props: PathFinderProps) {
		// Create grid
		this.grid = new Grid(props.grid);

		// init min-heap to extract minimum value
		this.openList = new Heap((a, b) => a.getFValue() <= b.getFValue());

		// Set diagonal boolean
		this.diagonalAllowed = props.diagonalAllowed ?? false;

		// Use smart pruning and jump neighbors
		this.useJumpPointSearch = props.useJumpPointSearch ?? false;

		// Set heuristic function
		this.heuristic = props.heuristic ?? (props.diagonalAllowed ? 'Octile' : 'Manhattan');

		// Set world values
		this.cellSize = props.cellSize;
		this.offsetPoint = props.offsetPoint;

		const maxNodeRatio = props.maxCoverageRatio ?? 1;
		this.nodeCoverageLimit = this.grid.nodeMax * maxNodeRatio;

		this.maxComputationTimeMs = props.maxComputationTimeMs ?? Infinity;
	}

	// evaluate shortest distance using cardinal directions
	// .98 to be just a little pessimitic in the heuristic
	private octileVal = 2 - Math.SQRT2;
	private octileValHeuristic = this.octileVal * 0.98;
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

		console.time('Path search');
		// Reset lists
		this.openList.clear();
		this.counter = 0;

		pathFindingLogger.info('******',startPosition);
		pathFindingLogger.info('******', endPosition);

		const startNode = this.grid.getNodeAt(startPosition, true);
		const endNode = this.grid.getNodeAt(endPosition);


		// Break if start and/or end position is/are not walkable
		if (startNode == null || endNode == null ||
			!this.grid.isWalkableAt(endPosition) ||
			!this.grid.isWalkableAt(startPosition)
		) {
			// Path could not be created because the start and/or end position is/are not walkable.
			pathFindingLogger.warn('Path could not be created because the start and/or end position is/are not walkable.',startPosition, endPosition);
			return [startPosition];
		}

		// Push start node into open list
		startNode.setIsOnOpenList(true);
		this.openList.insert(startNode);

		const timeLimit = performance.now() + this.maxComputationTimeMs;

		pathFindingLogger.info('node count before', this.grid.getNodeCount());

		// As long the open list is not empty, continue searching a path
		while (!this.openList.isEmpty()
			&& performance.now() < timeLimit
			&& this.counter < this.nodeCoverageLimit) {

			//get node with minimum f value
			const currentNode = this.openList.extract();
			currentNode.setIsOnOpenList(false);

			currentNode.setIsOnClosedList(true);
			
			// for debug ordering
			currentNode.counter = ++this.counter;
			// End of path is reached
			if (currentNode === endNode) {
				console.timeEnd('Path search');

				let path = this.backtrace(endNode);
				pathFindingLogger.info('Explored nodes', this.counter);
				pathFindingLogger.info('Node count end', this.grid.getNodeCount());
				if (algorithm === "AStarSmooth") {
					path = this.smoothPath(path, this.useJumpPointSearch, true);
				}
				return path;
			}

			// Get neighbors
			const candidates = this.grid.getCandidateNodes(
				currentNode,
				endNode,
				this.diagonalAllowed,
				this.useJumpPointSearch
			);

			// Loop through all the neighbors
			for (let i in candidates) {
				const neighbor = candidates[i]!;
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
						)
					);
				}

				updateVertexFN(currentNode, neighbor);
			}
		}

		// failed to find a path
		pathFindingLogger.debug('time',performance.now() < timeLimit);
		pathFindingLogger.debug('time',performance.now(), timeLimit);
		pathFindingLogger.debug('coverage', this.counter < this.nodeCoverageLimit);
		pathFindingLogger.debug('coverage < ', this.counter , this.nodeCoverageLimit);

		// Path could not be created
		pathFindingLogger.warn('Path could not be created, sorry -_-');

		return [startPosition];
	}


	/**
	 * Compute the path from the Node and return a path of points.
	 * Get parents recursively until the start of the path
	 */
	private backtrace(
		node: Node,
	): Point[] {
		// Init empty path
		const path: Point[] = [];

		let currentNode: Node = node;

		// Loop as long the current node has a parent
		while (currentNode.getParent()) {
			path.push(currentNode.position);
			currentNode = currentNode.getParent()!;
		}

		// If true we will also include the starting node
		path.push(currentNode.position);

		return path.reverse();
	}

	/**
	 * Check if there is an obstacle between two points
	 */
	private gridLOS(start: Point, end: Point): boolean {

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
			return this.grid.isWalkableAt(point);
		}

		if (dX >= dY) {
			// how many x cells for one vertical cell ?
			const pDx = dX / dY;

			// pattern starts at the middle of the first cell
			let cDx = pDx == Infinity ? 0 : pDx / 2;

			while (x0 !== x1) {
				const diff = Math.abs(cDx - pDx - 0.5)

				if (diff > 0.00001 && !testNode({ x: x0, y: y0 })) {
					return false;
				}
				if (
					dY > 0 &&
					(cDx >= pDx || // LOS moved to next line after start of current column
						pDx - cDx < 0.5) //  LOS will move to next line before next column
				) {
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
			let cDy = pDy == Infinity ? 0 : pDy / 2;

			while (y0 !== y1) {
				const diff = Math.abs(cDy - pDy - 0.5)

				if (diff > 0.0001 && !testNode({ x: x0, y: y0 })) {
					return false;
				}
				if (
					dX > 0 &&
					(cDy >= pDy || // LOS moved to next column after start of current line
						pDy - cDy < 0.5) //  LOS will move to next column before next line
				) {
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

	/**
	 * Smooth the path by linking points that can "see" each other
	 * @param resample path, use it when using jump point search
	 */
	public smoothPath(path: Point[], resamplePath: boolean, multipleSmoothings: boolean): Point[] {
		if (path.length < 3) {
			return path;
		}

		let resampledPath : Point[] = [];

		if(resamplePath){
		//build a path that has no jump (only 1 distance moves)
			resampledPath.push(path[0]);
			for (let i = 0; i < path.length - 1; ++i) 
			{
				const curr = path[i];
				const next = path[i+1];
				const dir = sub(next, curr);
				dir.x = dir.x / Math.max(Math.abs(dir.x), 1);
				dir.y = dir.y / Math.max(Math.abs(dir.y), 1);

				let movingPoint = curr;
				do{
					movingPoint = add(movingPoint, dir);
					resampledPath.push(movingPoint);
				}while(!equalsStrict(movingPoint, next));
			}

		}else{
			resampledPath = path;
		}

		let tK = resampledPath[0]!;

		let smoothedPath = [tK];

		for (let i = 0; i < resampledPath.length - 1; ++i) {
			if (!this.gridLOS(tK, resampledPath[i + 1]!)) {
				tK = resampledPath[i]!;
				smoothedPath.push(tK);
			}
		}

		smoothedPath.push(resampledPath[resampledPath.length - 1]!);

		if(multipleSmoothings){
			let previousLength = path.length;
			
			while(smoothedPath.length !== previousLength){
				previousLength = smoothedPath.length;
				smoothedPath = this.smoothPath(smoothedPath, false, false);
			}

		}
		
		return smoothedPath;
	}

	/**
	 * Find path between two points by visiting the graph
	 * Take world coordinate and return path in world coordinate
	 */
	public findPath(startWorldPosition: Point, endWorldPosition: Point, algorithm: Algorithm): Point[] {
		// Translate into grid points
		let startPosition = PathFinder.worldPointToGridPoint(startWorldPosition, this.cellSize, this.offsetPoint)
		let endPosition = PathFinder.worldPointToGridPoint(endWorldPosition, this.cellSize, this.offsetPoint)

		// Compute path
		const path = this._findPath(startPosition, endPosition, algorithm);

		// Translate back into world point and return
		return this.toWorldPath(path, startWorldPosition, startPosition, endWorldPosition);
	}

	public getGrid(): Grid {
		return this.grid;
	}

	/**
	 * Translate path in grid coordinates into world coordinates.
	 * Path beginning correction :
	 * Prepend a point such that from current position (which is decimal), 
	 * the trajectory goes out of the current cell with the same direction as it
	 * would if it was moving from the center of the cell
	 */
	private toWorldPath(path: Point[], worldStart: Point, localStart: Point, worldEnd: Point): Point[] {

		if(path.length < 2){
			return [worldStart, worldEnd];
		}
		const worldPath = path.map(point => PathFinder.gridPointToWorldPoint(point, this.cellSize, this.offsetPoint));


		const firstPathSegment : Segment = [worldPath[0], worldPath[1]];
		const contour = this.getCellContour(localStart);
		
		let intersection: Point | undefined = undefined;
		let i = 0;
		do{
			const seg: Segment = [contour[i], contour[i+1]]
			intersection = PathFinder.getSegmentIntersection(seg, firstPathSegment);
			i++;
		}while(intersection == undefined && i < contour.length-1);

		if(!intersection) {
			pathFindingLogger.warn('this is impooooosssible. There should be an intersection');
			pathFindingLogger.warn(contour);
			pathFindingLogger.warn(firstPathSegment);
		}
		pathFindingLogger.debug('path beginning', worldStart, intersection, worldPath)
		return [worldStart, intersection!, ...worldPath.slice(1), worldEnd]
	}

	private getCellContour(localStart: Point): Point[] {
		const p = localStart;
		const extent = new DiscreteExtent(
			p.x,
			p.y,
			p.x + 1,
			p.y + 1
		);
		return extent.contourWorld(this.cellSize, this.offsetPoint).map((p) => {return {x : p[0], y : p[1]}});

	}

	/**
	 * Segment intersection including segment extremities
	 */
	private static getSegmentIntersection(s1: Segment, s2: Segment, debug: boolean = false): Point | undefined {
		const p0 = s1[0], p1 = s1[1],
			p2 = s2[0], p3 = s2[1];

		const s10_x = p1.x - p0.x, s10_y = p1.y - p0.y,
			s32_x = p3.x - p2.x, s32_y = p3.y - p2.y;

		const denom = s10_x * s32_y - s32_x * s10_y

		if (denom == 0){
			if(debug) pathFindingLogger.debug('collinear', denom)
			return undefined // collinear
		}

		const s02_x = p0.x - p2.x,
			s02_y = p0.y - p2.y
		const s_numer = s10_x * s02_y - s10_y * s02_x
		if (s_numer != 0 && (s_numer < 0 == denom > 0)) {
			if(debug) pathFindingLogger.debug('s numer < 0', s_numer, denom);
			// no collision: s < 0
			return undefined
		}

		const t_numer = s32_x * s02_y - s32_y * s02_x
		if (t_numer != 0 && (t_numer < 0 == denom > 0)) {
			if(debug) pathFindingLogger.debug('t numer < 0', t_numer, denom);
			// no collision: t < 0
			return undefined
		}

		if (s_numer > denom == denom > 0 || t_numer > denom == denom > 0) {
			if(debug) pathFindingLogger.debug('s', s_numer, denom);
			if(debug) pathFindingLogger.debug('t', t_numer, denom);

			// no collision: s or t > 1
			return undefined;
		}
		// collision detected
		const t = t_numer / denom

		return { x: p0.x + (t * s10_x), y: p0.y + (t * s10_y) }
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
	private findPointsAtDistance(center: Point, nCells: number, addFunc : (p : Point) => void) {
		if (nCells === 0) {
			return [center];
		}

		const points: Point[] = [];

		const xMin = center.x - nCells;
		const xMax = center.x + nCells;

		const yMin = center.y - nCells;
		const yMax = center.y + nCells;

		// Top anb bottom lines
		for (let x = xMin; x <= xMax; x++) {
			addFunc({ x, y: yMin });
			addFunc({ x, y: yMax });
		}

		// left and right lines
		for (let y = yMin + 1; y < yMax; y++) {
			addFunc({ x: xMin, y });
			addFunc({ x: xMax, y });
		}

		return points;
	}

	/*
	 * Find the nearest point without obstacle
	 */
	/*
	public findNearestWalkablePoint(worldPoint: Point | undefined): Point | undefined {
		if(worldPoint){
			const gridPosition = PathFinder.worldPointToGridPoint(worldPoint, this.cellSize, this.offsetPoint);

			for (let distance = 0; distance < 5; distance++) {
				const points : Point[] = [];
				this.findPointsAtDistance(gridPosition, distance, (p => points.push(p)));
				for (let point of points) {
					if (this.grid.isWalkableAt(point)) {
						return PathFinder.gridPointToWorldPoint(point, this.cellSize, this.offsetPoint);
					}
				}
			}
		}
	}*/

	private findClosestWalkablePoint(gridPoint: Point, maxDist: number): Point{

		let d = 1;
		const h = new Heap<Point>((a,b) => lengthSquared(sub(a, gridPoint)) < lengthSquared(sub(b, gridPoint)));

		while(d < maxDist){
			this.findPointsAtDistance(gridPoint, d, (p => h.insert(p)));

			while(!h.isEmpty()){
				const p = h.extract();
				if(this.grid.isWalkableAt(p)){
					return p;
				}
			}
			d++;
		}

		return gridPoint;

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
			x: cell.x * cellSize + offsetPoint.x + cellSize / 2,
			y: cell.y * cellSize + offsetPoint.y + cellSize / 2
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
