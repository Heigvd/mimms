import { Point } from "./helper";

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
		//wlog('count');
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
		return !this.obstacleMatrix[p.y][p.x] || this.obstacleMatrix[p.y][p.x] < this.obstacleDensityThreshold;
		const node = this.getNodeAt(position, debug);
		return node ? node.getIsWalkable() : false;
		/*
		if (this.gridNodes[position.y] == null
			|| this.gridNodes[position.y][position.x] == null) {
			if (debug) {
				wlog("Position outside of the grid")
			}
			return true; // WHYYYYY ?
		}
		else {
			if (debug) {
				const newMatrix: string[][] = this.gridToMatrix();
				newMatrix[position.y][position.x] = "?";
				Grid.drawGrid(newMatrix);
			}
			return this.gridNodes[position.y][position.x].getIsWalkable();
		}*/
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
				if (x !== currentPosition.x || y !== currentPosition.y) {
					if (x == currentPosition.x || y == currentPosition.y || diagnonalMovementAllowed) {
						if (this.isOnTheGrid({ x, y })) {
							if (this.isWalkableAt({ x, y })) {
								surroundingNodes.push(this.getNodeAt({ x, y }));
							}
						}
					}
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
				if (this.nodeExists({ x: x, y: y })) {
					const n = this.getNodeAt({ x: x, y: y });
					n.setIsOnClosedList(false);
					n.setIsOnOpenList(false);
					n.setParent(undefined);
					n.setFGHValuesToZero();
				}

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

		for (let y = 0; y < this.height; y++) {
			if (this.gridNodes[y]) {
				cloneGrid[y] = [];
				for (let x = 0; x < this.width; x++) {
					if (this.gridNodes[y][x]) {
						cloneGrid[y][x] = new Node({
							id: this.gridNodes[y][x].id,
							position: { x: x, y: y },
							walkable: this.gridNodes[y][x].getIsWalkable()
						});
					}
				}
			}
		}
		return cloneGrid;
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

	public counter: number = 0;

	// Grid
	public grid: Grid;

	// Lists
	//private closedList: Node[];
	public openList: Node[];

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
		//this.closedList = [];
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
		this.weight = props.weight ?? 1;

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
			case 'EuclideanSq':
				return (dx * dx + dy * dy) * weight;
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
		//this.closedList = [];
		this.openList = [];

		// Reset grid
		//this.grid.resetGrid();

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
		this.openList.push(startNode);

		// Loop through the grid
		// Set the FGH values of non walkable nodes to zero and push them on the closed list
		// Set the H value for walkable nodes
		/*for (let y = 0; y < this.grid.height; y++) {
			for (let x = 0; x < this.grid.width; x++) {
				let node = this.grid.getNodeAt({ x, y });
				if (!this.grid.isWalkableAt({ x, y })) {
					// OK, this node is not walkable
					// Set FGH values to zero
					node.setFGHValuesToZero();
					// Put on closed list
					node.setIsOnClosedList(true);
					//this.closedList.push(node);
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
		}*/

		// As long the open list is not empty, continue searching a path
		while (this.openList.length !== 0) {
			// Get node with lowest f value
			let minF = Infinity;
			let minIdx = -1;

			for (let i in this.openList) {
				const f = this.openList[i].getFValue();
				if (f < minF) {
					minF = f;
					minIdx = +i;
				}
			}

			if (minIdx === -1) {
				throw Error("Node not found");
			}

			// Move current node from open list to closed list
			const currentNode = this.openList[minIdx];
			currentNode.setIsOnOpenList(false);

			this.openList.splice(minIdx, 1);
			currentNode.setIsOnClosedList(true);

			currentNode.counter = ++this.counter;

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
				const neighbor = neighbors[i];

				// Continue if node on closed list
				if (neighbor.getIsOnClosedList()) {
					continue;
				}

				if (neighbor.getHValue() == null) {
					//compute H value
					neighbor.setHValue(
						this.calculateWeightedDistance(
							this.heuristic,
							neighbor.position,
							endNode.position,
							this.weight
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
	private gridLOSBug(start: Point, end: Point, debug: boolean = false): boolean {

		if (debug) {
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
				if (
					dY === 0
					&& !this.grid.isWalkableAt({ x: x0 + ((sX - 1) / 2), y: y0 }, debug)
					&& !this.grid.isWalkableAt({ x: x0 + ((sX - 1) / 2), y: y0 - 1 }, debug)) // Horizontal move // WHYYYYYYY 
				{
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
				if (!testNode({ x: x0, y: y0 })) {
					return false;
				}
				if (
					cDx >= pDx || // LOS moved to next line after start of current column
					pDx - cDx < 0.5 //  LOS will move to next line before next column
				) {
					// move to next line now
					y0 += sY;
					cDx -= pDx;
					if (!testNode({ x: x0, y: y0 })) {
						return false;
					}
				} else {

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
				if (!testNode({ x: x0, y: y0 })) {
					return false;
				}
				if (
					cDy >= pDy || // LOS moved to next column after start of current line
					pDy - cDy < 0.5 //  LOS will move to next column before next line
				) {
					// move to next column now
					x0 += sX;
					cDy -= pDy;
					if (!testNode({ x: x0, y: y0 })) {
						return false;
					}
				} else {

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
			offsetPoint: { x: 0, y: 0 }
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
	 * Smooth the path by linking points that can "see" eachothers
	 */
	public smoothPathSemiBug(path: Point[]): Point[] {
		if (path.length < 3) {
			return path;
		}

		let tK = path[0];
		const smoothedPath = [tK];

		for (let i = 0; i < path.length - 1; ++i) {
			if (!this.gridLOSBug(tK, path[i + 1])) {
				tK = path[i];
				smoothedPath.push(path[i]);
			}
		}
		smoothedPath.push(path[path.length - 1]);
		return smoothedPath;
	}


	/**
	 * Smooth the path by linking points that can "see" eachothers
	 */
	public smoothPathBug(path: Point[]): Point[] {
		if (path.length < 3) {
			return path;
		}

		let k = 0;
		let tK = path[k];
		const smoothedPath = [path[k]];

		for (let i = 0; i < path.length - 1; ++i) {
			if (!this.gridLOSBug(tK, path[i + 1])) {
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
	private AStarUpdateVertex(currentNode: Node, neighbor: Node) {
		// Calculate the g value of the neightbor
		const nextGValue = currentNode.getGValue() +
			(neighbor.position.x !== currentNode.position.x &&
				neighbor.position.y !== currentNode.position.y
				? this.weight * Math.SQRT2 : this.weight);

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
				this.openList.push(neighbor);
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
	 * find all points loacated at exactlly nCells from the given center.
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

	/**
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

	public getHeuristic() {
		return this.heuristic
	}

	// Setter methods
	public setHeuristic(newHeuristic: Heuristic): void {
		this.heuristic = newHeuristic;
	}
	public setWeight(newWeight: number): void {
		this.weight = newWeight;
	}

	// Getter methods
	/*
	public getGridClone(): Node[][] {
		return this.grid.clone();
	}*/
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
			x: cell.x * cellSize + offsetPoint.x + cellSize / 2,
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

//PathFinder.testLOS();