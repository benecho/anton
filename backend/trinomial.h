
#ifndef TRINOMIAL_H
#define TRINOMIAL_H

enum OptionType { CALL = 0, PUT = 1 };

// Estructura de parámetros completa del subyacente y el modelo.
typedef struct {
  double S0;
  double r;

  // Parámetros de la opción específica
  double T;       // Vencimiento
  double K;       // Strike
  int isAmerican; // 1 = Americana, 0 = Europea
  enum OptionType type;

  // Parámetros del modelo (Malla y Volatilidad)
  int N; // Pasos de tiempo

  // Estructura de Volatilidad Local
  int M;         // Número de tramos
  double *Theta; // Vector de volatilidades σ_m (size M)
  double *tau;   // Vector de tiempos τ[] (size M+1)

} Params;

// NUEVA ESTRUCTURA: Contiene todos los resultados calculados
typedef struct {
  double price;
  int N;             // Dimensión (para saber el tamaño de los arrays)
  double *priceTree; // Árbol de precios S_{i,j}
  double *valueTree; // Árbol de valores V_{i,j}
} TrinomialResults;

// NUEVA FUNCIÓN: Ejecuta el modelo, asigna memoria y retorna los resultados
// completos.
TrinomialResults runTrinomialModel(Params p);

// Función para liberar la memoria asignada por runTrinomialModel
void freeTrinomialResults(TrinomialResults *res);

// Función principal del pricer (mantenida para compatibilidad y calibración
// rápida)
double computeTrinomial(Params p,
                        double *priceTree, // o NULL
                        double *valueTree  // o NULL
);

// Función de error de calibración E(Θ)
double calibrationError(double *Theta, // vector M
                        int M,
                        double lambda, // Penalización suavidad
                        Params *tmpl, double *Klist, double *Tlist,
                        double *Vmarket, double *w, int nOptions);

// Optimización estilo Nelder–Mead
void nelderMead(double *Theta0, int M, double lambda, Params *tmpl,
                double *Klist, double *Tlist, double *Vmarket, double *w,
                int nOptions, int maxIter, double tol);

#endif
