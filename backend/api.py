from fastapi import FastAPI
from fastapi.responses import JSONResponse
import ctypes
import numpy as np

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción cambiar esto por el dominio real
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================================
# Cargar librería C
# ==========================================================
lib = ctypes.CDLL("./binomial_model.so")

# ==========================================================
# Definir struct Params (idéntico al C)
# ==========================================================
class Params(ctypes.Structure):
    _fields_ = [
        ("S0", ctypes.c_double),
        ("K", ctypes.c_double),
        ("T", ctypes.c_double),
        ("N", ctypes.c_int),
        ("r", ctypes.c_double),
        ("sigma", ctypes.c_double),
        ("type", ctypes.c_int)
    ]

# ==========================================================
# Declarar función computeBinomial del C
# double computeBinomial(Params p, double *priceTree, double *valueTree)
# ==========================================================
lib.computeBinomial.restype = ctypes.c_double
lib.computeBinomial.argtypes = [
    Params,
    ctypes.POINTER(ctypes.c_double),
    ctypes.POINTER(ctypes.c_double)
]

# ==========================================================
#  Endpoint 1: SOLO PRECIO
# ==========================================================
@app.get("/price")
def price(S0: float, K: float, T: float, N: int, r: float, sigma: float, type: str):

    option_type = 0 if type.upper() == "CALL" else 1

    p = Params(S0, K, T, N, r, sigma, option_type)

    price = lib.computeBinomial(p, None, None)

    return {"price": price}

# ==========================================================
#  Endpoint 2: ÁRBOL COMPLETO + PRECIO
# ==========================================================
@app.get("/tree")
def tree(S0: float, K: float, T: float, N: int, r: float, sigma: float, type: str):

    option_type = 0 if type.upper() == "CALL" else 1

    p = Params(S0, K, T, N, r, sigma, option_type)

    size = (N + 1) * (N + 1)

    # Crear arrays C
    PriceTreeArray = (ctypes.c_double * size)()
    ValueTreeArray = (ctypes.c_double * size)()

    # Llamada al C → calcula todo
    price = lib.computeBinomial(
        p,
        PriceTreeArray,
        ValueTreeArray
    )

    # Convertir a NumPy para manejarlo fácilmente
    priceTree = np.ctypeslib.as_array(PriceTreeArray).reshape((N+1, N+1))
    valueTree = np.ctypeslib.as_array(ValueTreeArray).reshape((N+1, N+1))

    # Convertir a listas normales para JSON
    priceTree_json = [
        priceTree[i, :i+1].tolist() for i in range(N+1)
    ]
    valueTree_json = [
        valueTree[i, :i+1].tolist() for i in range(N+1)
    ]

    return JSONResponse({
        "price": price,
        "priceTree": priceTree_json,
        "valueTree": valueTree_json
    })
