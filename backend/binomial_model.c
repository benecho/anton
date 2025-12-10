#include <math.h>
#include <stdlib.h>

enum OptionType { CALL = 0, PUT = 1 };

typedef struct {
  double S0;
  double K;
  double T;
  int N;
  double r;
  double sigma;
  enum OptionType type;
} Params;

// ==========================================================================
// 1. Calcular precio RÁPIDO (si no quieres árbol)
// ==========================================================================
double fastBinomialPrice(Params p) {
  double dt = p.T / p.N;
  double u = exp(p.sigma * sqrt(dt));
  double d = 1.0 / u;
  double R = exp(p.r * dt);
  double disc = 1.0 / R;
  double q = (R - d) / (u - d);

  double *V = malloc((p.N + 1) * sizeof(double));
  double S = p.S0 * pow(d, p.N);

  for (int j = 0; j <= p.N; j++) {
    V[j] = (p.type == CALL) ? fmax(S - p.K, 0) : fmax(p.K - S, 0);
    S *= u * u;
  }

  for (int i = p.N - 1; i >= 0; i--) {
    for (int j = 0; j <= i; j++)
      V[j] = disc * (q * V[j + 1] + (1.0 - q) * V[j]);
  }

  double result = V[0];
  free(V);
  return result;
}

// ==========================================================================
// 2. Construir árbol de precios SOLO si priceTree != NULL
//    (si priceTree == NULL, simplemente NO hace nada)
// ==========================================================================
void buildPriceTree(Params p, double *priceTree) {
  if (priceTree == NULL)
    return; // ← CONDICIONAL

  double dt = p.T / p.N;
  double u = exp(p.sigma * sqrt(dt));
  double d = 1.0 / u;

  for (int i = 0; i <= p.N; i++) {
    for (int j = 0; j <= i; j++) {
      priceTree[i * (p.N + 1) + j] = p.S0 * pow(u, j) * pow(d, i - j);
    }
  }
}

// ==========================================================================
// 3. Construir árbol de valores SOLO si valueTree != NULL
// ==========================================================================
void buildValueTree(Params p, double *valueTree) {
  if (valueTree == NULL)
    return; // ← CONDICIONAL

  double dt = p.T / p.N;
  double u = exp(p.sigma * sqrt(dt));
  double d = 1.0 / u;
  double R = exp(p.r * dt);
  double disc = 1.0 / R;
  double q = (R - d) / (u - d);

  double *S = malloc((p.N + 1) * (p.N + 1) * sizeof(double));
  buildPriceTree(p, S);

  // Payoff en vencimiento
  for (int j = 0; j <= p.N; j++) {
    double Sij = S[p.N * (p.N + 1) + j];
    valueTree[p.N * (p.N + 1) + j] =
        (p.type == CALL) ? fmax(Sij - p.K, 0) : fmax(p.K - Sij, 0);
  }

  // Backward induction
  for (int i = p.N - 1; i >= 0; i--) {
    for (int j = 0; j <= i; j++) {
      double Vup = valueTree[(i + 1) * (p.N + 1) + (j + 1)];
      double Vdown = valueTree[(i + 1) * (p.N + 1) + j];
      valueTree[i * (p.N + 1) + j] = disc * (q * Vup + (1 - q) * Vdown);
    }
  }

  free(S);
}

// ==========================================================================
// 4. FUNCIÓN PRINCIPAL "TODO EN UNO" PARA FASTAPI
//    - Calcula SIEMPRE el precio
//    - Construye árboles SOLO si se le pasa memoria
// ==========================================================================
double computeBinomial(Params p,
                       double *priceTree, // pasar NULL si no quieres el árbol
                       double *valueTree  // pasar NULL si no quieres el árbol
) {
  // Si se piden árboles, construirlos
  if (priceTree != NULL)
    buildPriceTree(p, priceTree);

  if (valueTree != NULL)
    buildValueTree(p, valueTree);

  // Calcular siempre el precio
  return fastBinomialPrice(p);
}
