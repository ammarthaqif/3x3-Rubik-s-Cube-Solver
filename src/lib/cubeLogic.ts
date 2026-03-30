import { CubeState, Color } from '../types';

function rotateFace(face: Color[], clockwise: boolean): Color[] {
  const newFace = [...face];
  if (clockwise) {
    newFace[0] = face[6]; newFace[1] = face[3]; newFace[2] = face[0];
    newFace[3] = face[7]; newFace[4] = face[4]; newFace[5] = face[1];
    newFace[6] = face[8]; newFace[7] = face[5]; newFace[8] = face[2];
  } else {
    newFace[0] = face[2]; newFace[1] = face[5]; newFace[2] = face[8];
    newFace[3] = face[1]; newFace[4] = face[4]; newFace[5] = face[7];
    newFace[6] = face[0]; newFace[7] = face[3]; newFace[8] = face[6];
  }
  return newFace;
}

export function applyMove(state: CubeState, move: string): CubeState {
  const newState = JSON.parse(JSON.stringify(state)) as CubeState;
  const baseMove = move[0] as keyof CubeState;
  const modifier = move.substring(1);

  const repeat = modifier === '2' ? 2 : 1;
  const clockwise = modifier !== "'";

  for (let i = 0; i < repeat; i++) {
    // Rotate the face itself
    newState[baseMove] = rotateFace(newState[baseMove], clockwise);

    // Rotate adjacent stickers
    const temp = Array(3).fill('gray');
    if (baseMove === 'U') {
      if (clockwise) {
        for (let j = 0; j < 3; j++) temp[j] = newState.F[j];
        for (let j = 0; j < 3; j++) newState.F[j] = newState.R[j];
        for (let j = 0; j < 3; j++) newState.R[j] = newState.B[j];
        for (let j = 0; j < 3; j++) newState.B[j] = newState.L[j];
        for (let j = 0; j < 3; j++) newState.L[j] = temp[j];
      } else {
        for (let j = 0; j < 3; j++) temp[j] = newState.F[j];
        for (let j = 0; j < 3; j++) newState.F[j] = newState.L[j];
        for (let j = 0; j < 3; j++) newState.L[j] = newState.B[j];
        for (let j = 0; j < 3; j++) newState.B[j] = newState.R[j];
        for (let j = 0; j < 3; j++) newState.R[j] = temp[j];
      }
    } else if (baseMove === 'D') {
      if (clockwise) {
        for (let j = 0; j < 3; j++) temp[j] = newState.F[6 + j];
        for (let j = 0; j < 3; j++) newState.F[6 + j] = newState.L[6 + j];
        for (let j = 0; j < 3; j++) newState.L[6 + j] = newState.B[6 + j];
        for (let j = 0; j < 3; j++) newState.B[6 + j] = newState.R[6 + j];
        for (let j = 0; j < 3; j++) newState.R[6 + j] = temp[j];
      } else {
        for (let j = 0; j < 3; j++) temp[j] = newState.F[6 + j];
        for (let j = 0; j < 3; j++) newState.F[6 + j] = newState.R[6 + j];
        for (let j = 0; j < 3; j++) newState.R[6 + j] = newState.B[6 + j];
        for (let j = 0; j < 3; j++) newState.B[6 + j] = newState.L[6 + j];
        for (let j = 0; j < 3; j++) newState.L[6 + j] = temp[j];
      }
    } else if (baseMove === 'L') {
      const indices = [0, 3, 6];
      const bIndices = [8, 5, 2];
      if (clockwise) {
        for (let j = 0; j < 3; j++) temp[j] = newState.F[indices[j]];
        for (let j = 0; j < 3; j++) newState.F[indices[j]] = newState.U[indices[j]];
        for (let j = 0; j < 3; j++) newState.U[indices[j]] = newState.B[bIndices[j]];
        for (let j = 0; j < 3; j++) newState.B[bIndices[j]] = newState.D[indices[j]];
        for (let j = 0; j < 3; j++) newState.D[indices[j]] = temp[j];
      } else {
        for (let j = 0; j < 3; j++) temp[j] = newState.F[indices[j]];
        for (let j = 0; j < 3; j++) newState.F[indices[j]] = newState.D[indices[j]];
        for (let j = 0; j < 3; j++) newState.D[indices[j]] = newState.B[bIndices[j]];
        for (let j = 0; j < 3; j++) newState.B[bIndices[j]] = newState.U[indices[j]];
        for (let j = 0; j < 3; j++) newState.U[indices[j]] = temp[j];
      }
    } else if (baseMove === 'R') {
      const indices = [2, 5, 8];
      const bIndices = [6, 3, 0];
      if (clockwise) {
        for (let j = 0; j < 3; j++) temp[j] = newState.F[indices[j]];
        for (let j = 0; j < 3; j++) newState.F[indices[j]] = newState.D[indices[j]];
        for (let j = 0; j < 3; j++) newState.D[indices[j]] = newState.B[bIndices[j]];
        for (let j = 0; j < 3; j++) newState.B[bIndices[j]] = newState.U[indices[j]];
        for (let j = 0; j < 3; j++) newState.U[indices[j]] = temp[j];
      } else {
        for (let j = 0; j < 3; j++) temp[j] = newState.F[indices[j]];
        for (let j = 0; j < 3; j++) newState.F[indices[j]] = newState.U[indices[j]];
        for (let j = 0; j < 3; j++) newState.U[indices[j]] = newState.B[bIndices[j]];
        for (let j = 0; j < 3; j++) newState.B[bIndices[j]] = newState.D[indices[j]];
        for (let j = 0; j < 3; j++) newState.D[indices[j]] = temp[j];
      }
    } else if (baseMove === 'F') {
      const uIdx = [6, 7, 8], rIdx = [0, 3, 6], dIdx = [2, 1, 0], lIdx = [8, 5, 2];
      if (clockwise) {
        for (let j = 0; j < 3; j++) temp[j] = newState.U[uIdx[j]];
        for (let j = 0; j < 3; j++) newState.U[uIdx[j]] = newState.L[lIdx[j]];
        for (let j = 0; j < 3; j++) newState.L[lIdx[j]] = newState.D[dIdx[j]];
        for (let j = 0; j < 3; j++) newState.D[dIdx[j]] = newState.R[rIdx[j]];
        for (let j = 0; j < 3; j++) newState.R[rIdx[j]] = temp[j];
      } else {
        for (let j = 0; j < 3; j++) temp[j] = newState.U[uIdx[j]];
        for (let j = 0; j < 3; j++) newState.U[uIdx[j]] = newState.R[rIdx[j]];
        for (let j = 0; j < 3; j++) newState.R[rIdx[j]] = newState.D[dIdx[j]];
        for (let j = 0; j < 3; j++) newState.D[dIdx[j]] = newState.L[lIdx[j]];
        for (let j = 0; j < 3; j++) newState.L[lIdx[j]] = temp[j];
      }
    } else if (baseMove === 'B') {
      const uIdx = [2, 1, 0], rIdx = [8, 5, 2], dIdx = [6, 7, 8], lIdx = [0, 3, 6];
      if (clockwise) {
        for (let j = 0; j < 3; j++) temp[j] = newState.U[uIdx[j]];
        for (let j = 0; j < 3; j++) newState.U[uIdx[j]] = newState.R[rIdx[j]];
        for (let j = 0; j < 3; j++) newState.R[rIdx[j]] = newState.D[dIdx[j]];
        for (let j = 0; j < 3; j++) newState.D[dIdx[j]] = newState.L[lIdx[j]];
        for (let j = 0; j < 3; j++) newState.L[lIdx[j]] = temp[j];
      } else {
        for (let j = 0; j < 3; j++) temp[j] = newState.U[uIdx[j]];
        for (let j = 0; j < 3; j++) newState.U[uIdx[j]] = newState.L[lIdx[j]];
        for (let j = 0; j < 3; j++) newState.L[lIdx[j]] = newState.D[dIdx[j]];
        for (let j = 0; j < 3; j++) newState.D[dIdx[j]] = newState.R[rIdx[j]];
        for (let j = 0; j < 3; j++) newState.R[rIdx[j]] = temp[j];
      }
    }
  }

  return newState;
}

export function getCubeAtStep(initialState: CubeState, solution: string[], step: number): CubeState {
  let state = JSON.parse(JSON.stringify(initialState)) as CubeState;
  for (let i = 0; i <= step; i++) {
    state = applyMove(state, solution[i]);
  }
  return state;
}
