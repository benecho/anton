
#include "trinomial.h"
#include <math.h>
#include <stdio.h>
#include <stdlib.h>


// Función auxiliar para imprimir una sección del árbol
void printTreeSection(int N, double *tree, const char *name) {
  if (!tree)
    return;
  printf("\n--- Malla de %s (Ej. Niveles 0, 1, y N) ---\n", name);

// Función de mapeo (la repetimos aquí para la impresión)
#define IDX(i, j, N) (i * (2 * N + 1) + (j + N))

  // Nivel 0 (t=0)
  printf("Nivel i=0 (t=0.0): %s[0, 0] = %.4f\n", name, tree[IDX(0, 0, N)]);

  // Nivel 1 (t=dt)
  if (N >= 1) {
    printf("Nivel i=1 (t=dt): %s[1,-1]=%.4f, %s[1,0]=%.4f, %s[1,1]=%.4f\n",
           name, tree[IDX(1, -1, N)], name, tree[IDX(1, 0, N)], name,
           tree[IDX(1, 1, N)]);
  }

  // Nivel N (t=T) - solo 5 nodos centrales
  if (N > 5) {
    printf("Nivel i=N (t=T=%.1f) - 5 nodos centrales:\n", 1.0);
    for (int j = -2; j <= 2; j++) {
      printf("  %s[N,%+d] = %.4f\n", name, j, tree[IDX(N, j, N)]);
    }
  }
#undef IDX
}

int main() {

  printf("--- Modelo Trinomial Recombinante con Devolucion de Arboles ---\n\n");

  // 1. CONFIGURACIÓN BASE DEL MODELO
  Params P;
  P.S0 = 100.0;
  P.r = 0.05;
  P.N = 50; // Pasos temporales (usamos 50 para que el ejemplo de impresión no
            // sea gigante)

  P.u = 1.02;
  P.d = 1.0 / P.u;

  P.M = 3;
  double tau[] = {0.0, 0.4, 0.7, 1.0};
  double Theta_initial[] = {0.20, 0.25, 0.22};

  P.tau = tau;
  P.Theta = Theta_initial;

  // 2. OPCIÓN A VALORAR
  P.K = 100.0;
  P.T = 1.0;
  P.type = CALL;
  P.isAmerican = 1; // Americana

  // 3. EJECUCIÓN DEL MODELO Y OBTENCIÓN DE TODOS LOS RESULTADOS
  printf("Ejecutando modelo (N=%d pasos, Call Americana)...\n", P.N);
  TrinomialResults results = runTrinomialModel(P);

  if (isnan(results.price)) {
    fprintf(stderr, "ERROR: Fallo en la asignación de memoria.\n");
    return 1;
  }

  // 4. IMPRESIÓN DEL PRECIO Y DATOS DEL ÁRBOL
  printf("\n--- RESULTADOS ---");
  printf("\nPrecio Final de la Opcion: %.8f\n", results.price);

  // Imprimir secciones del árbol de Precios
  printTreeSection(results.N, results.priceTree, "Precios S");

  // Imprimir secciones del árbol de Valores
  printTreeSection(results.N, results.valueTree, "Valores V");

  // 5. LIBERACIÓN DE MEMORIA (CRUCIAL)
  freeTrinomialResults(&results);
  printf("\nMemoria de los arboles liberada.\n");

  return 0;
}
