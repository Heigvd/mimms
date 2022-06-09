import { Point } from "./helper";

/**
 * isSymbol : check if value is of type Symbol
 * Copied from Loadash
 * https://github.com/lodash/lodash/blob/2f79053d7bc7c9c9561a30dda202b3dcd2b72b90/isSymbol.js
 */
function isSymbol(value: any) {
	const type = typeof value
	return type == 'symbol' || (type === 'object' && value != null && Object.prototype.toString.call(value) == '[object Symbol]')
}

/**
 * minBy : compute the minimum value from the original array by iterating over each element
 * Copied from Loadash
 * https://github.com/lodash/lodash/blob/2f79053d7bc7c9c9561a30dda202b3dcd2b72b90/minBy.js
 */
function minBy<T>(array: T[], iteratee: (item: T) => number | string) {
	let result
	if (array == null) {
		return result
	}
	let computed
	for (const value of array) {
		const current = iteratee(value)

		if (current != null && (computed === undefined
			? (current === current && !isSymbol(current))
			: (current < computed)
		)) {
			computed = current
			result = value
		}
	}
	return result
}

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
	private hValue: number;

	// Path finding algorithm data
	private parentNode: Node | undefined;
	private isOnClosedList: boolean;
	private isOnOpenList: boolean;

	constructor(props: NodeProps) {
		this.id = props.id;
		this.position = props.position;
		this.isWalkable = props.walkable || true;
		this.hValue = 0;
		this.gValue = 0;
		this.fValue = 0;
		this.parentNode = undefined;
		this.isOnClosedList = false;
		this.isOnOpenList = false;
	}

	/**
	 * Calculate or Recalculate the F value
	 */
	private calculateFValue(): void {
		this.fValue = this.gValue + this.hValue;
	}

	/**
	 * Set the g value of the node
	 */
	public setGValue(gValue: number): void {
		this.gValue = gValue;
		// The G value has changed, so recalculate the f value
		this.calculateFValue();
	}

	/**
	 * Set the h value of the node
	 */
	public setHValue(hValue: number): void {
		this.hValue = hValue;
		// The H value has changed, so recalculate the f value
		this.calculateFValue();
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

	public getHValue(): number {
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

	// The node grid
	private gridNodes: Node[][];

	constructor(props: GridProps) {
		// Set the general properties
		this.width = props.width;
		this.height = props.height;
		this.numberOfFields = this.width * this.height;

		// Create and generate the matrix
		this.gridNodes = this.buildGridWithNodes(
			props.matrix,
			this.width,
			this.height,
			props.obstacleDensityThreshold
		);
	}

	/**
	 * Build grid, fill it with nodes and return it.
	 */
	private buildGridWithNodes(
		matrix: number[][],
		width: number,
		height: number,
		obstacleDensityThreshold: number = 0,
	): Node[][] {
		const newGrid: Node[][] = [];
		let id: number = 0;

		// Generate an empty matrix
		for (let y = 0; y < height; y++) {
			newGrid[y] = [];
			for (let x = 0; x < width; x++) {
				newGrid[y][x] = new Node({
					id: id,
					position: { x: x, y: y }
				});

				id++;
			}
		}

		/**
		 * In case we have a matrix loaded.
		 * Load up the informations of the matrix.
		 */
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				if (matrix[y][x] > obstacleDensityThreshold) {
					newGrid[y][x].setIsWalkable(false);
				} else {
					newGrid[y][x].setIsWalkable(true);
				}
			}
		}

		return newGrid;
	}

	/**
	 * Return a specific node.
	 */
	public getNodeAt(position: Point): Node {
		const node = this.gridNodes[position.y][position.x];
		if (node == null) {
			throw Error("Node shouldn't be null!")
		}
		return node;
	}

	/**
	 * Check if specific node walkable.
	 */
	public isWalkableAt(position: Point, debug: boolean = false): boolean {
		if (this.gridNodes[position.y] == null
			|| this.gridNodes[position.y][position.x] == null) {
			if (debug) {
				wlog("Position outside of the grid")
			}
			return true;
		}
		else {
			if (debug) {
				const newMatrix: string[][] = this.gridToMatrix();
				newMatrix[position.y][position.x] = "?";
				Grid.drawGrid(newMatrix);
			}
			return this.gridNodes[position.y][position.x].getIsWalkable();
		}
	}

	/**
	 * Check if specific node is on the grid.
	 */
	private isOnTheGrid(position: Point): boolean {
		return (
			position.x >= 0 &&
			position.x < this.width &&
			position.y >= 0 &&
			position.y < this.height
		);
	}

	/**
	 * Get surrounding nodes.
	 */
	public getSurroundingNodes(
		currentPosition: Point,
		diagnonalMovementAllowed: boolean
	): Node[] {
		const surroundingNodes: Node[] = [];

		for (var y = currentPosition.y - 1; y <= currentPosition.y + 1; y++) {
			for (var x = currentPosition.x - 1; x <= currentPosition.x + 1; x++) {
				if (this.isOnTheGrid({ x, y })) {
					if (this.isWalkableAt({ x, y })) {
						if (diagnonalMovementAllowed) {
							surroundingNodes.push(this.getNodeAt({ x, y }));
						} else {
							if (x == currentPosition.x || y == currentPosition.y) {
								surroundingNodes.push(this.getNodeAt({ x, y }));
							}
						}
					} else {
						continue;
					}
				} else {
					continue;
				}
			}
		}

		return surroundingNodes;
	}

	/**
	 * Set the grid
	 */
	public setGrid(newGrid: Node[][]): void {
		this.gridNodes = newGrid;
	}

	/**
	 * Reset the grid
	 */
	public resetGrid(): void {
		for (let y = 0; y < this.gridNodes.length; y++) {
			for (let x = 0; x < this.gridNodes[y].length; x++) {
				this.gridNodes[y][x].setIsOnClosedList(false);
				this.gridNodes[y][x].setIsOnOpenList(false);
				this.gridNodes[y][x].setParent(undefined);
				this.gridNodes[y][x].setFGHValuesToZero();
			}
		}
	}

	/**
	 * Get all the nodes of the grid.
	 */
	public getGridNodes(): Node[][] {
		return this.gridNodes;
	}

	/**
	 * Get a clone of the grid
	 */
	public clone(): Node[][] {
		const cloneGrid: Node[][] = [];
		let id: number = 0;

		for (let y = 0; y < this.height; y++) {
			cloneGrid[y] = [];
			for (let x = 0; x < this.width; x++) {
				cloneGrid[y][x] = new Node({
					id: id,
					position: { x: x, y: y },
					walkable: this.gridNodes[y][x].getIsWalkable()
				});

				id++;
			}
		}
		return cloneGrid;
	}

	/**
	 * Transfor the node grid into a visual matrix with · for allowed cell and X for obstacles
	 */
	public gridToMatrix(): string[][] {
		return this.gridNodes.map(line => line.map(node => node.getIsWalkable() ? "·" : "X"));
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
	| 'Chebyshev'
	| 'Octile';

/**
 * Algorithms that can be used for path finding
 */
type Algorithm = "AStar" | "AStarSmooth" | "ThetaStar";

interface PathFinderProps {
	grid: GridProps;
	diagonalAllowed?: boolean;
	heuristic?: Heuristic;
	weight?: number;
	includeStartNode?: boolean;
	includeEndNode?: boolean;
	cellSize: number;
	offsetPoint: Point;
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

	// Grid
	private grid: Grid;

	// Lists
	private closedList: Node[];
	private openList: Node[];

	// Pathway variables
	readonly diagonalAllowed: boolean;
	private heuristic: Heuristic;
	readonly includeStartNode: boolean;
	readonly includeEndNode: boolean;
	private weight: number;

	constructor(props: PathFinderProps) {
		// Create grid
		this.grid = new Grid(props.grid);

		// Init lists
		this.closedList = [];
		this.openList = [];

		// Set diagonal boolean
		this.diagonalAllowed =
			props.diagonalAllowed ?? false;

		// Set heuristic function
		this.heuristic = props.heuristic ?? 'Manhattan';

		// Set if start node included
		this.includeStartNode =
			props.includeStartNode !== undefined ? props.includeStartNode : true;

		// Set if end node included
		this.includeEndNode =
			props.includeEndNode !== undefined ? props.includeEndNode : true;

		// Set weight
		this.weight = props.weight || 1;

		// Set world values
		this.cellSize = props.cellSize;
		this.offsetPoint = props.offsetPoint;
	}

	/**
	 * Calculate weighted distance with the selected heuristic
	 */
	private calculateWeightedDistance(
		heuristicFunction: Heuristic,
		pos0: Point,
		pos1: Point,
		weight: number
	): number {
		const dx = Math.abs(pos1.x - pos0.x);
		const dy = Math.abs(pos1.y - pos0.y);

		switch (heuristicFunction) {
			case 'Manhattan':
				return (dx + dy) * weight;
			case 'Euclidean':
				return Math.sqrt(dx * dx + dy * dy) * weight;
			case 'Chebyshev':
				return Math.max(dx, dy) * weight;
			case 'Octile':
				return (dx + dy - 0.58 * Math.min(dx, dy)) * weight;
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
				updateVertexFN = this.AStarUpdateVertex.bind(this);
				break;
			case "ThetaStar":
			default:
				updateVertexFN = this.ThetaStarUpdateVertex.bind(this);
		}

		// Reset lists
		this.closedList = [];
		this.openList = [];

		// Reset grid
		this.grid.resetGrid();

		const startNode = this.grid.getNodeAt(startPosition);
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
		this.openList.push(startNode);

		// Loop through the grid
		// Set the FGH values of non walkable nodes to zero and push them on the closed list
		// Set the H value for walkable nodes
		for (let y = 0; y < this.grid.height; y++) {
			for (let x = 0; x < this.grid.width; x++) {
				let node = this.grid.getNodeAt({ x, y });
				if (!this.grid.isWalkableAt({ x, y })) {
					// OK, this node is not walkable
					// Set FGH values to zero
					node.setFGHValuesToZero();
					// Put on closed list
					node.setIsOnClosedList(true);
					this.closedList.push(node);
				} else {
					// OK, this node is walkable
					// Calculate the H value with the corresponding heuristic function
					node.setHValue(
						this.calculateWeightedDistance(
							this.heuristic,
							node.position,
							endNode.position,
							this.weight
						)
					);
				}
			}
		}

		// As long the open list is not empty, continue searching a path
		while (this.openList.length !== 0) {
			// Get node with lowest f value
			const currentNode = minBy(this.openList, (o) => {
				return o.getFValue();
			}) as Node;

			// Move current node from open list to closed list
			currentNode.setIsOnOpenList(false);
			const nodeIndex = this.openList.findIndex(node => currentNode.id === node.id)
			if (nodeIndex === -1) {
				throw Error("Node not found");
			}
			this.openList.splice(nodeIndex, 1);

			currentNode.setIsOnClosedList(true);
			this.closedList.push(currentNode);

			// End of path is reached
			if (currentNode === endNode) {
				const path = this.backtrace(endNode, this.includeStartNode, this.includeEndNode);
				if (algorithm === "AStarSmooth") {
					return this.smoothPath(path)
				}
				else {
					return path;
				}
			}

			// Get neighbors
			const neighbors = this.grid.getSurroundingNodes(
				currentNode.position,
				this.diagonalAllowed
			);

			// Loop through all the neighbors
			for (let i in neighbors) {
				const neightbor = neighbors[i];

				// Continue if node on closed list
				if (neightbor.getIsOnClosedList()) {
					continue;
				}

				updateVertexFN(currentNode, neightbor);
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
			const nodeGrid = this.grid.getGridNodes();
			if (nodeGrid.length < start.y || nodeGrid.length < end.y
				|| nodeGrid[0]?.length < start.x || nodeGrid[0]?.length < end.x) {
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
		let f = 0;

		if (dY < 0) {
			dY = -dY
			sY = -1;
		}
		if (dX < 0) {
			dX = -dX
			sX = -1;
		}
		if (dX >= dY) {
			while (x0 !== x1) {
				f += dY;
				if (f >= dX) {
					if (!this.grid.isWalkableAt({ x: x0 + ((sX - 1) / 2), y: y0 + ((sY - 1) / 2) }, debug)) {
						return false;
					}
					y0 += sY;
					f -= dX;
				}
				if (f === 0 && !this.grid.isWalkableAt({ x: x0 + ((sX - 1) / 2), y: y0 + ((sY - 1) / 2) }, debug)) {
					return false;
				}
				if (dY === 0 && !this.grid.isWalkableAt({ x: x0 + ((sX - 1) / 2), y: y0 }, debug) && !this.grid.isWalkableAt({ x: x0 + ((sX - 1) / 2), y: y0 - 1 }, debug)) {
					return false;
				}

				if (debug) {
					this.grid.isWalkableAt({ x: x0, y: y0 }, debug);
				}

				x0 += sX;
			}
		}
		else {
			while (y0 !== y1) {
				f += dX;
				if (f >= dY) {
					if (!this.grid.isWalkableAt({ x: x0 + ((sX - 1) / 2), y: y0 + ((sY - 1) / 2) }, debug)) {
						return false;
					}
					x0 += sX;
					f -= dY;
				}
				if (f === 0 && !this.grid.isWalkableAt({ x: x0 + ((sX - 1) / 2), y: y0 + ((sY - 1) / 2) }, debug)) {
					return false;
				}
				if (dX === 0 && !this.grid.isWalkableAt({ x: x0, y: y0 + ((sY - 1) / 2) }, debug) && !this.grid.isWalkableAt({ x: x0 - 1, y: y0 + ((sY - 1) / 2) }, debug)) {
					return false;
				}
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
			offsetPoint: { x: 0, y: 0 }
		});

		Grid.drawGrid(grid)

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
	}

	/**
	 * Smooth the path by linking points that can "see" eachothers
	 */
	public smoothPath(path: Point[]): Point[] {
		if (path.length < 3) {
			return path;
		}

		let k = 0;
		let tK = path[k];
		const smoothedPath = [path[k]];

		for (let i = 0; i < path.length - 1; ++i) {
			if (!this.gridLOS(tK, path[i + 1])) {
				k += 1;
				tK = path[k];
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
	 * AStar Update vertex algorithm implementation
	 */
	private AStarUpdateVertex(currentNode: Node, neightbor: Node) {
		// Calculate the g value of the neightbor
		const nextGValue = currentNode.getGValue() +
			(neightbor.position.x !== currentNode.position.x ||
				neightbor.position.y! == currentNode.position.y
				? this.weight
				: this.weight * 1.41421);

		// Is the neighbor not on open list OR
		// can it be reached with lower g value from current position
		if (
			!neightbor.getIsOnOpenList() ||
			nextGValue < neightbor.getGValue()
		) {
			neightbor.setGValue(nextGValue);
			neightbor.setParent(currentNode);

			if (!neightbor.getIsOnOpenList()) {
				neightbor.setIsOnOpenList(true);
				this.openList.push(neightbor);
			} else {
				// okay this is a better way, so change the parent
				neightbor.setParent(currentNode);
			}
		}
	}

	/**
	 * ThetaStar Update vertex algorithm implementation
	 */
	private ThetaStarUpdateVertex(currentNode: Node, neightbor: Node) {
		const currentParent = currentNode.getParent();
		if (currentParent != null && this.gridLOS(currentParent.position, neightbor.position)) {
			this.AStarUpdateVertex(currentParent, neightbor)
		}
		else {
			this.AStarUpdateVertex(currentNode, neightbor);
		}
	}

	/**
	 * Find the nearest point without obstacle
	 */
	public findNearestWalkablePoint(position: Point):Point | undefined {
		const gridPosition = PathFinder.worldPointToGridPoint(position, this.cellSize, this.offsetPoint);
		const neighbors = this.grid.getSurroundingNodes(gridPosition, true)
		for(const neighbor of neighbors){
			if(neighbor.getIsWalkable()){
				return PathFinder.gridPointToWorldPoint(neighbor.position,this.cellSize, this.offsetPoint);
			}
		}
		// Looping again for recursion so we find the nearest point around the position
		for(const neighbor of neighbors){
			return this.findNearestWalkablePoint(neighbor.position);
		}
	}


	// Setter methods
	public setHeuristic(newHeuristic: Heuristic): void {
		this.heuristic = newHeuristic;
	}
	public setWeight(newWeight: number): void {
		this.weight = newWeight;
	}

	// Getter methods
	public getGridClone(): Node[][] {
		return this.grid.clone();
	}
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
			x: cell.x * cellSize + offsetPoint.x,
			y: cell.y * cellSize + offsetPoint.y
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
			x: Math.round((point.x - offsetPoint.x) / cellSize),
			y: Math.round((point.y - offsetPoint.y) / cellSize),
		}
	}
}

// PathFinder.testLOS();
