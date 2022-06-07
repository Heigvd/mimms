import { getBuildingInExtent, isPointInPolygon, lineSegmentInterception } from "./geoData";
import { Point, Polygon, Segment } from "./helper";

// Loadash
//https://github.com/lodash/lodash/blob/2f79053d7bc7c9c9561a30dda202b3dcd2b72b90/isSymbol.js
function isSymbol(value: any) {
	const type = typeof value
	return type == 'symbol' || (type === 'object' && value != null && Object.prototype.toString.call(value) == '[object Symbol]')
}

//https://github.com/lodash/lodash/blob/2f79053d7bc7c9c9561a30dda202b3dcd2b72b90/minBy.js
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

// Types
type Heuristic =
	| 'Manhattan'
	| 'Euclidean'
	| 'Chebyshev'
	| 'Octile';

interface AStarProps {
	grid: GridProps;
	diagonalAllowed?: boolean;
	heuristic?: Heuristic;
	weight?: number;
	includeStartNode?: boolean;
	includeEndNode?: boolean;
}

interface GridProps {
	width?: number;
	height?: number;
	matrix?: number[][];
	densityOfObstacles?: number;
}

interface NodeProps {
	id: number;
	position: Point;
	walkable?: boolean;
}

function calculateHeuristic(
	heuristicFunction: Heuristic,
	pos0: Point,
	pos1: Point,
	weight: number
): number {
	const dx = Math.abs(pos1.x - pos0.x);
	const dy = Math.abs(pos1.y - pos0.y);

	switch (heuristicFunction) {
		case 'Manhattan':
			/**
			 * Calculate the Manhattan distance.
			 * Generally: Overestimates distances because diagonal movement not taken into accout.
			 * Good for a 4-connected grid (diagonal movement not allowed)
			 */
			return (dx + dy) * weight;
		case 'Euclidean':
			/**
			 * Calculate the Euclidean distance.
			 * Generally: Underestimates distances, assuming paths can have any angle.
			 * Can be used f.e. when units can move at any angle.
			 */
			return Math.sqrt(dx * dx + dy * dy) * weight;
		case 'Chebyshev':
			/**
			 * Calculate the Chebyshev distance.
			 * Should be used when diagonal movement is allowed.
			 * D * (dx + dy) + (D2 - 2 * D) * Math.min(dx, dy)
			 * D = 1 and D2 = 1
			 * => (dx + dy) - Math.min(dx, dy)
			 * This is equivalent to Math.max(dx, dy)
			 */
			return Math.max(dx, dy) * weight;
		case 'Octile':
			/**
			 * Calculate the Octile distance.
			 * Should be used on an 8-connected grid (diagonal movement allowed).
			 * D * (dx + dy) + (D2 - 2 * D) * Math.min(dx, dy)
			 * D = 1 and D2 = sqrt(2)
			 * => (dx + dy) - 0.58 * Math.min(dx, dy)
			 */
			return (dx + dy - 0.58 * Math.min(dx, dy)) * weight;
	}
}

class Node {
	readonly id: number;
	readonly position: Point;

	private fValue: number;
	private gValue: number;
	private hValue: number;
	private parentNode: Node | undefined;
	private isOnClosedList: boolean;
	private isOnOpenList: boolean;
	private isWalkable: boolean;

	constructor(props: NodeProps) {
		this.id = props.id;
		this.position = props.position;

		this.hValue = 0;
		this.gValue = 0;
		this.fValue = 0;
		this.parentNode = undefined;
		this.isOnClosedList = false;
		this.isOnOpenList = false;
		this.isWalkable = props.walkable || true;
	}

	/**
	 * Calculate or Recalculate the F value
	 * This is a private function
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


class Grid {
	// General properties
	readonly width: number;
	readonly height: number;
	readonly numberOfFields: number;

	// The node grid
	private gridNodes: Node[][];

	constructor(props: GridProps) {
		// Set the general properties
		if (props.width && props.height) {
			this.width = props.width;
			this.height = props.height;
			this.numberOfFields = this.width * this.height;
		} else if (props.matrix) {
			this.width = props.matrix[0].length;
			this.height = props.matrix.length;
			this.numberOfFields = this.width * this.height;
		}
		else {
			throw Error("No matrix or width/height given")
		}

		// Create and generate the matrix
		this.gridNodes = this.buildGridWithNodes(
			props.matrix || undefined,
			this.width,
			this.height,
			props.densityOfObstacles || 0
		);
	}

	/**
	 * Build grid, fill it with nodes and return it.
	 * @param matrix [ 0 or 1: 0 = walkable; 1 = not walkable ]
	 * @param width [grid width]
	 * @param height [grid height]
	 * @param densityOfObstacles [density of non walkable fields]
	 */
	private buildGridWithNodes(
		matrix: number[][] | undefined,
		width: number,
		height: number,
		densityOfObstacles?: number
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
		 * If we have not loaded a predefined matrix,
		 * loop through our grid and set random obstacles.
		 */
		if (matrix === undefined) {
			for (let y = 0; y < height; y++) {
				for (let x = 0; x < width; x++) {
					const rndNumber = Math.floor(Math.random() * 10) + 1;
					if (rndNumber > 10 - (densityOfObstacles ?? 0)) {
						newGrid[y][x].setIsWalkable(false);
					} else {
						newGrid[y][x].setIsWalkable(true);
					}
				}
			}

			return newGrid;
		}

		/**
		 * In case we have a matrix loaded.
		 * Load up the informations of the matrix.
		 */
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				if (matrix[y][x]) {
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
	 * @param position [position on the grid]
	 */
	public getNodeAt(position: Point): Node {
		return this.gridNodes[position.y][position.x];
	}

	/**
	 * Check if specific node walkable.
	 * @param position [position on the grid]
	 */
	public isWalkableAt(position: Point): boolean {
		return this.gridNodes[position.y][position.x].getIsWalkable();
	}

	/**
	 * Check if specific node is on the grid.
	 * @param position [position on the grid]
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
	 * @param currentXPos [x-position on the grid]
	 * @param currentYPos [y-position on the grid]
	 * @param diagnonalMovementAllowed [is diagnonal movement allowed?]
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
}

function backtrace(
	node: Node,
	includeStartNode: boolean,
	includeEndNode: boolean
): number[][] {
	// Init empty path
	const path: number[][] = [];

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
		path.push([currentNode.position.x, currentNode.position.y]);
		currentNode = currentNode.getParent()!;
	}

	// If true we will also include the starting node
	if (includeStartNode) {
		path.push([currentNode.position.x, currentNode.position.y]);
	}

	return path.reverse();
}

class AStar {
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

	constructor(aParams: AStarProps) {
		// Create grid
		this.grid = new Grid({
			width: aParams.grid.width,
			height: aParams.grid.height,
			matrix: aParams.grid.matrix || undefined,
			densityOfObstacles: aParams.grid.densityOfObstacles || 0
		});

		// Init lists
		this.closedList = [];
		this.openList = [];

		// Set diagonal boolean
		this.diagonalAllowed =
			aParams.diagonalAllowed !== undefined ? aParams.diagonalAllowed : true;

		// Set heuristic function
		this.heuristic = aParams.heuristic ? aParams.heuristic : 'Manhattan';

		// Set if start node included
		this.includeStartNode =
			aParams.includeStartNode !== undefined ? aParams.includeStartNode : true;

		// Set if end node included
		this.includeEndNode =
			aParams.includeEndNode !== undefined ? aParams.includeEndNode : true;

		// Set weight
		this.weight = aParams.weight || 1;
	}

	public findPath(startPosition: Point, endPosition: Point): number[][] {
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
						calculateHeuristic(
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
				return backtrace(endNode, this.includeStartNode, this.includeEndNode);
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

				// Calculate the g value of the neightbor
				const nextGValue =
					currentNode.getGValue() +
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
		}
		// Path could not be created
		return [];
	}

	/**
	 * Set the heuristic to be used for pathfinding.
	 * @param newHeuristic
	 */
	public setHeuristic(newHeuristic: Heuristic): void {
		this.heuristic = newHeuristic;
	}

	/**
	 * Set the weight for the heuristic function.
	 * @param newWeight
	 */
	public setWeight(newWeight: number): void {
		this.weight = newWeight;
	}

	/**
	 * Get a copy/clone of the grid.
	 */
	public getGridClone(): Node[][] {
		return this.grid.clone();
	}

	/**
	 * Get the current grid
	 */
	public getGrid(): Grid {
		return this.grid;
	}
}

/**
 * Generates a 2d grid with numbers. Astar check if the number is lower than the obstacle density to allow moving on it.
 * @param obstacles An array of polygon
 * @param worldHeight the height of the world
 * @param worldWidth the width of the world
 * @param cellSize the width = height of one cell
 */
export function generateGridMatrix(obstacles: Point[][], worldHeight: number, worldWidth: number, cellSize: number, firstPointOffset: Point) {
	let grid: number[][] = [];

	const gridHeight =  Math.round(worldHeight / cellSize);
	const gridWidth =  Math.round(worldWidth / cellSize);

	const totalCells = gridHeight * gridWidth;
	const slices = Math.round(totalCells / 100);

	for (let j = 0; j < gridHeight; j += 1) {
		grid[j] = [];
		for (let i = 0; i < gridWidth; i += 1) {
		    
			const cellIndex = i+j*gridWidth;
		    if(cellIndex%slices === 0 ){
		        wlog(Math.round(cellIndex*100/totalCells) + "%");
				debugger;
		    }

			grid[j][i] = 0;

			const x = (i / gridWidth) * worldWidth - worldWidth / 2;
			const y =
				0 -
				((j / gridHeight) * worldHeight - worldHeight / 2) -
				cellSize;

			const pointA: Point = { x, y };
			const pointB: Point = { x, y: y + cellSize };
			const pointC: Point = { x: x + cellSize, y: y + cellSize };
			const pointD: Point = { x: x + cellSize, y };

			const wall1: Segment = [pointA, pointB];
			const wall2: Segment = [pointB, pointC];
			const wall3: Segment = [pointC, pointD];
			const wall4: Segment = [pointD, pointA];

			const node: Polygon = [pointA, pointB, pointC, pointD];
			const test = getBuildingInExtent([x+firstPointOffset.x, y+firstPointOffset.y, x+cellSize+firstPointOffset.x, y+cellSize+firstPointOffset.y])
			
	//debugger;
/*
			for (const buildingIndex in obstacles) {
				const building: Polygon = obstacles[buildingIndex];

				if (
					isPointInPolygon(pointA, building) ||
					isPointInPolygon(pointB, building) ||
					isPointInPolygon(pointC, building) ||
					isPointInPolygon(pointD, building)
				) {
					grid[j][i] = 1;
					break;
				}

				for (let pointIndex = 0; pointIndex < building.length; ++pointIndex) {
					const firstPoint = building[pointIndex];
					const secondPoint = building[(pointIndex + 1) % building.length]
					const buildingWall: Segment = [firstPoint, secondPoint];
					if (
						isPointInPolygon(firstPoint, node) ||
						isPointInPolygon(secondPoint, node) ||
						lineSegmentInterception(wall1, buildingWall) ||
						lineSegmentInterception(wall2, buildingWall) ||
						lineSegmentInterception(wall3, buildingWall) ||
						lineSegmentInterception(wall4, buildingWall)) {
						grid[j][i] = 1;
						break;
					}
				}
			}
	*/
		}
	}
	return grid;
}
