
#include "trinomial.h"
#include <float.h> // Para NAN
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// =====================================================
// UTILIDADES INTERNAS
// =====================================================

// Mapeo de índices 2D a 1D. i en [0, N], j en [-i, i].
static inline int idx(int i, int j, int N) { return i * (2 * N + 1) + (j + N); }

// Obtener volatilidad sigma_i según el tiempo t_i
static double sigma_at_step(int i, Params p) {
  double dt = p.T / p.N;
  double t = i * dt;

  for (int m = 0; m < p.M; m++) {
    // [tau_{m}, tau_{m+1})
    if (t >= p.tau[m] && t < p.tau[m + 1]) {
      return p.Theta[m];
    }
  }
  return p.Theta[p.M - 1];
}

// Cálculo analítico de probabilidades (PDF)
static void trinomial_probs(double sigma_i, double r, double dt, double u,
                            double d, double *pu, double *pm, double *pd) {
  double M_factor = exp(r * dt);
  double V = sigma_i * sigma_i * dt + M_factor * M_factor;

  double den_ud = (u - 1.0) * (u - d);
  double den_du = (d - 1.0) * (d - u);

  *pu = (V - M_factor * (d + 1.0) + d) / den_ud;
  *pd = (V - M_factor * (u + 1.0) + u) / den_du;
  *pm = 1.0 - *pu - *pd;

  // Normalización (ajustes recomendados en Source 137-147)
  if (*pu < 0.0)
    *pu = 0.0;
  if (*pu > 1.0)
    *pu = 1.0;
  if (*pd < 0.0)
    *pd = 0.0;
  if (*pd > 1.0)
    *pd = 1.0;

  *pm = 1.0 - *pu - *pd;

  if (*pm < 0.0) {
    *pm = 0.0;
    double sum = *pu + *pd;
    if (sum > 0) {
      *pu /= sum;
      *pd /= sum;
    }
  }
}

// Árbol de precios S_{i,j} = S0 * u^j
static void buildPriceTree(Params p, double *PT) {
  if (!PT)
    return;
  for (int i = 0; i <= p.N; i++) {
    for (int j = -i; j <= i; j++) {
      PT[idx(i, j, p.N)] = p.S0 * pow(p.u, j);
    }
  }
}

// Construye árbol de valores V_{i,j}
static void buildValueTree(Params p, double *VT, double *PT) {

  if (!VT)
    return;

  double dt = p.T / p.N;
  double disc = exp(-p.r * dt);

  double *localPT = NULL;
  if (!PT) {
    localPT = (double *)malloc((p.N + 1) * (2 * p.N + 1) * sizeof(double));
    buildPriceTree(p, localPT);
    PT = localPT;
  }

  // 1. PAYOFF FINAL (t_N)
  for (int j = -p.N; j <= p.N; j++) {
    double S = PT[idx(p.N, j, p.N)];
    double val = (p.type == CALL ? (S - p.K) : (p.K - S));
    VT[idx(p.N, j, p.N)] = (val > 0) ? val : 0.0;
  }

  // 2. BACKWARD INDUCTION
  for (int i = p.N - 1; i >= 0; i--) {

    double sigma = sigma_at_step(i, p);
    double pu, pm, pd;
    trinomial_probs(sigma, p.r, dt, p.u, p.d, &pu, &pm, &pd);

    for (int j = -i; j <= i; j++) {

      double V_u = VT[idx(i + 1, j + 1, p.N)];
      double V_m = VT[idx(i + 1, j, p.N)];
      double V_d = VT[idx(i + 1, j - 1, p.N)];

      double cont = disc * (pu * V_u + pm * V_m + pd * V_d);

      if (p.isAmerican) {
        // Opción Americana: max(V_{cont}, V_{intr})
        double S = PT[idx(i, j, p.N)];
        double intr = (p.type == CALL ? (S - p.K) : (p.K - S));
        if (intr < 0)
          intr = 0;
        VT[idx(i, j, p.N)] = (cont > intr) ? cont : intr;

      } else {
        VT[idx(i, j, p.N)] = cont;
      }
    }
  }

  if (localPT)
    free(localPT);
}

// Pricer rápido sin guardar árboles (para Nelder-Mead)
static double trinomialPricerOnly(Params p) {
  // Lógica eficiente de valoración sin construir el árbol de precios.
  double dt = p.T / p.N;
  double disc = exp(-p.r * dt);
  int W = 2 * p.N + 1;
  double *V = (double *)malloc((p.N + 1) * W * sizeof(double));

  if (!V)
    return NAN;

  // PAYOFF FINAL
  for (int j = -p.N; j <= p.N; j++) {
    double S = p.S0 * pow(p.u, j);
    double val = (p.type == CALL ? (S - p.K) : (p.K - S));
    V[idx(p.N, j, p.N)] = (val > 0) ? val : 0.0;
  }

  // BACKWARD INDUCTION
  for (int i = p.N - 1; i >= 0; i--) {

    double sigma = sigma_at_step(i, p);
    double pu, pm, pd;
    trinomial_probs(sigma, p.r, dt, p.u, p.d, &pu, &pm, &pd);

    for (int j = -i; j <= i; j++) {

      double cont =
          disc * (pu * V[idx(i + 1, j + 1, p.N)] + pm * V[idx(i + 1, j, p.N)] +
                  pd * V[idx(i + 1, j - 1, p.N)]);

      if (p.isAmerican) {
        double S = p.S0 * pow(p.u, j);
        double intr = (p.type == CALL ? (S - p.K) : (p.K - S));
        if (intr < 0)
          intr = 0;
        V[idx(i, j, p.N)] = (cont > intr) ? cont : intr;
      } else {
        V[idx(i, j, p.N)] = cont;
      }
    }
  }

  double res = V[idx(0, 0, p.N)];
  free(V);
  return res;
}

// =====================================================
// FUNCIONES DE RESULTADOS Y MEMORIA
// =====================================================

// IMPLEMENTACIÓN NUEVA: Retorna la estructura con todos los datos
TrinomialResults runTrinomialModel(Params p) {
  TrinomialResults res;
  res.N = p.N;
  int size = (p.N + 1) * (2 * p.N + 1);

  // Asignar memoria para los arrays de resultados
  res.priceTree = (double *)malloc(size * sizeof(double));
  res.valueTree = (double *)malloc(size * sizeof(double));

  if (!res.priceTree || !res.valueTree) {
    // Manejo de error de asignación de memoria
    if (res.priceTree)
      free(res.priceTree);
    if (res.valueTree)
      free(res.valueTree);
    res.price = NAN;
    res.priceTree = NULL;
    res.valueTree = NULL;
    return res;
  }

  // Construir los árboles
  buildPriceTree(p, res.priceTree);
  // buildValueTree necesita el árbol de precios (ya asignado)
  buildValueTree(p, res.valueTree, res.priceTree);

  // Obtener precio final
  res.price = res.valueTree[idx(0, 0, p.N)];

  return res;
}

// IMPLEMENTACIÓN NUEVA: Libera la memoria de los arrays dentro de la estructura
void freeTrinomialResults(TrinomialResults *res) {
  if (res && res->priceTree) {
    free(res->priceTree);
    res->priceTree = NULL;
  }
  if (res && res->valueTree) {
    free(res->valueTree);
    res->valueTree = NULL;
  }
  // No liberamos 'res' en sí, ya que se asume que se pasa por valor o está en
  // el stack/heap del llamante
}

// Función principal antigua (mantenida para compatibilidad y calibración)
double computeTrinomial(Params p, double *priceTree, double *valueTree) {
  if (priceTree || valueTree) {
    // Si se pide algún árbol, usamos la construcción completa
    double *local_PT = NULL;
    double *PT_ptr = priceTree;

    if (!PT_ptr) { // Si no se proporciona PT, lo necesitamos para VT
      int size = (p.N + 1) * (2 * p.N + 1);
      local_PT = (double *)malloc(size * sizeof(double));
      buildPriceTree(p, local_PT);
      PT_ptr = local_PT;
    } else {
      // Si se proporciona el puntero, lo rellenamos
      buildPriceTree(p, priceTree);
    }

    double *local_VT = NULL;
    double *VT_ptr = valueTree;
    int free_local_VT = 0;

    if (!VT_ptr) { // Si no se proporciona VT, lo necesitamos para el precio
      int size = (p.N + 1) * (2 * p.N + 1);
      local_VT = (double *)malloc(size * sizeof(double));
      VT_ptr = local_VT;
      free_local_VT = 1;
    }

    buildValueTree(p, VT_ptr, PT_ptr);
    double price = VT_ptr[idx(0, 0, p.N)];

    if (free_local_VT)
      free(local_VT);
    if (local_PT)
      free(local_PT);

    return price;
  }

  // Si no se pide ningún árbol, usamos la versión rápida (trinomialPricerOnly)
  return trinomialPricerOnly(p);
}

double calibrationError(double *Theta, int M, double lambda, Params *tmpl,
                        double *Klist, double *Tlist, double *Vmarket,
                        double *w, int nOptions) {
  double sse = 0.0;
  Params p = *tmpl;
  p.Theta = Theta;

  for (int k = 0; k < nOptions; k++) {
    p.K = Klist[k];
    p.T = Tlist[k];
    p.isAmerican = 0;

    double modelPrice = trinomialPricerOnly(p);
    double diff = modelPrice - Vmarket[k];
    sse += w[k] * (diff * diff);
  }

  double penalty = 0.0;
  for (int m = 0; m < M - 1; m++) {
    double d = Theta[m + 1] - Theta[m];
    penalty += d * d;
  }

  return sse + lambda * penalty;
}

void nelderMead(double *ThetaStart, int M, double lambda, Params *tmpl,
                double *Klist, double *Tlist, double *Vmarket, double *w,
                int nOptions, int maxIter, double tol) {
  // Parámetros estándar de Nelder-Mead
  double alpha = 1.0, gamma = 2.0, rho = 0.5, sigma = 0.5;

  int n = M;            // Dimensión
  int n_points = n + 1; // Simplex tiene n+1 puntos

  // Array de puntos del simplex [n+1][n]
  double **simplex = (double **)malloc(n_points * sizeof(double *));
  double *scores = (double *)malloc(n_points * sizeof(double));

  // Inicialización del simplex
  // Punto 0 es el inicial
  simplex[0] = (double *)malloc(n * sizeof(double));
  memcpy(simplex[0], ThetaStart, n * sizeof(double));
  scores[0] = calibrationError(simplex[0], n, lambda, tmpl, Klist, Tlist,
                               Vmarket, w, nOptions);

  // Los otros n puntos se generan perturbando cada dimensión
  for (int i = 1; i < n_points; i++) {
    simplex[i] = (double *)malloc(n * sizeof(double));
    memcpy(simplex[i], ThetaStart, n * sizeof(double));
    // Perturbación del 5% o 0.01
    double step = (simplex[i][i - 1] != 0) ? simplex[i][i - 1] * 0.05 : 0.01;
    simplex[i][i - 1] += step;
    scores[i] = calibrationError(simplex[i], n, lambda, tmpl, Klist, Tlist,
                                 Vmarket, w, nOptions);
  }

  // Buffers temporales
  double *centroid = (double *)malloc(n * sizeof(double));
  double *reflected = (double *)malloc(n * sizeof(double));
  double *expanded = (double *)malloc(n * sizeof(double));
  double *contracted = (double *)malloc(n * sizeof(double));

  for (int iter = 0; iter < maxIter; iter++) {
    // 1. Ordenar índices según scores (Bubble sort simple para n pequeño)
    int indices[n_points];
    for (int i = 0; i < n_points; i++)
      indices[i] = i;

    for (int i = 0; i < n_points - 1; i++) {
      for (int j = 0; j < n_points - i - 1; j++) {
        if (scores[indices[j]] > scores[indices[j + 1]]) {
          int temp = indices[j];
          indices[j] = indices[j + 1];
          indices[j + 1] = temp;
        }
      }
    }

    // Comprobar convergencia
    double best_score = scores[indices[0]];
    double worst_score = scores[indices[n]];
    if (fabs(worst_score - best_score) < tol)
      break;

    // 2. Centroide (excluyendo el peor punto)
    for (int j = 0; j < n; j++)
      centroid[j] = 0.0;
    for (int i = 0; i < n; i++) { // n puntos mejores
      int idx_p = indices[i];
      for (int j = 0; j < n; j++)
        centroid[j] += simplex[idx_p][j];
    }
    for (int j = 0; j < n; j++)
      centroid[j] /= n;

    // 3. Reflexión
    int worst_idx = indices[n];
    for (int j = 0; j < n; j++)
      reflected[j] =
          centroid[j] + alpha * (centroid[j] - simplex[worst_idx][j]);
    double reflected_score = calibrationError(reflected, n, lambda, tmpl, Klist,
                                              Tlist, Vmarket, w, nOptions);

    if (reflected_score >= scores[indices[0]] &&
        reflected_score < scores[indices[n - 1]]) {
      // Aceptar reflejado
      memcpy(simplex[worst_idx], reflected, n * sizeof(double));
      scores[worst_idx] = reflected_score;
      continue;
    }

    // 4. Expansión
    if (reflected_score < scores[indices[0]]) {
      for (int j = 0; j < n; j++)
        expanded[j] = centroid[j] + gamma * (reflected[j] - centroid[j]);
      double expanded_score = calibrationError(expanded, n, lambda, tmpl, Klist,
                                               Tlist, Vmarket, w, nOptions);

      if (expanded_score < reflected_score) {
        memcpy(simplex[worst_idx], expanded, n * sizeof(double));
        scores[worst_idx] = expanded_score;
      } else {
        memcpy(simplex[worst_idx], reflected, n * sizeof(double));
        scores[worst_idx] = reflected_score;
      }
      continue;
    }

    // 5. Contracción
    if (reflected_score < scores[indices[n]]) { // Contracción externa
      for (int j = 0; j < n; j++)
        contracted[j] = centroid[j] + rho * (reflected[j] - centroid[j]);
      double contracted_score = calibrationError(
          contracted, n, lambda, tmpl, Klist, Tlist, Vmarket, w, nOptions);
      if (contracted_score < reflected_score) {
        memcpy(simplex[worst_idx], contracted, n * sizeof(double));
        scores[worst_idx] = contracted_score;
        continue;
      }
    } else { // Contracción interna
      for (int j = 0; j < n; j++)
        contracted[j] =
            centroid[j] + rho * (simplex[worst_idx][j] - centroid[j]);
      double contracted_score = calibrationError(
          contracted, n, lambda, tmpl, Klist, Tlist, Vmarket, w, nOptions);
      if (contracted_score < scores[indices[n]]) {
        memcpy(simplex[worst_idx], contracted, n * sizeof(double));
        scores[worst_idx] = contracted_score;
        continue;
      }
    }

    // 6. Encogimiento (Shrink)
    int best_idx = indices[0];
    for (int i = 1; i < n_points; i++) {
      int idx_p = indices[i]; // No tocar el mejor
      for (int j = 0; j < n; j++) {
        simplex[idx_p][j] = simplex[best_idx][j] +
                            sigma * (simplex[idx_p][j] - simplex[best_idx][j]);
      }
      scores[idx_p] = calibrationError(simplex[idx_p], n, lambda, tmpl, Klist,
                                       Tlist, Vmarket, w, nOptions);
    }
  }

  // Copiar el mejor resultado a ThetaStart
  int final_best_idx = 0;
  double min_s = scores[0];
  for (int i = 1; i < n_points; i++) {
    if (scores[i] < min_s) {
      min_s = scores[i];
      final_best_idx = i;
    }
  }
  memcpy(ThetaStart, simplex[final_best_idx], n * sizeof(double));

  // Limpieza
  for (int i = 0; i < n_points; i++)
    free(simplex[i]);
  free(simplex);
  free(scores);
  free(centroid);
  free(reflected);
  free(expanded);
  free(contracted);
}
