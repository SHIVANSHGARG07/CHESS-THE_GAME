const socket = io();

const chess = new Chess();
const boardElement = document.querySelector(".chessboard");
const whiteCapturedElement = document.querySelector(".white-captured");
const blackCapturedElement = document.querySelector(".black-captured");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
let capturedWhitePieces = [];
let capturedBlackPieces = [];

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";

    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add(
                "square",
                (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
            );
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "white" : "black"
                );

                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                pieceElement.addEventListener("dragend", () => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    // Ensure flipping logic is applied after rendering
    if (playerRole === "b") {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }

    renderCapturedPieces();
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: "q"  // Assuming promotion to queen for simplicity
    };
    const result = chess.move(move);
    if (result) {
        if (result.captured) {
            if (result.color === 'w') {
                capturedBlackPieces.push(result.captured);
            } else {
                capturedWhitePieces.push(result.captured);
            }
        }
        renderBoard();
        socket.emit("move", move);
    }
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        p: "♙",
        r: "♜",
        n: "♞",
        b: "♝",
        q: "♛",
        k: "♚",
        P: "♙",
        R: "♖",
        N: "♘",
        B: "♗",
        Q: "♕",
        K: "♔"
    };
    return unicodePieces[piece.type] || "";
};

const renderCapturedPieces = () => {
    whiteCapturedElement.innerHTML = "";
    blackCapturedElement.innerHTML = "";

    capturedWhitePieces.forEach((piece) => {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add("piece", "white");
        pieceElement.innerText = getPieceUnicode({ type: piece, color: 'w' });
        whiteCapturedElement.appendChild(pieceElement);
    });

    capturedBlackPieces.forEach((piece) => {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add("piece", "black");
        pieceElement.innerText = getPieceUnicode({ type: piece, color: 'b' });
        blackCapturedElement.appendChild(pieceElement);
    });
};

socket.on("playerRole", (role) => {
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", () => {
    playerRole = null;
    renderBoard();
});

socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
});

socket.on("move", (move) => {
    const result = chess.move(move);
    if (result.captured) {
        if (result.color === 'w') {
            capturedBlackPieces.push(result.captured);
        } else {
            capturedWhitePieces.push(result.captured);
        }
    }
    renderBoard();
});

renderBoard();