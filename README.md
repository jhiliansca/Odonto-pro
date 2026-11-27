

Otros comandos (disponibles desde la raíz):

```bash
npm run build
npm run lint
npm test
npm run db:setup
npm run db:ensure
npm run db:seed
npm run db:users
npm run db:schema
```

## Cuentas iniciales

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `admin@odontopro.local` | `Admin123!` |
| Docente | `docente@odontopro.local` | `Docente123!` |
| Estudiante | `estudiante@odontopro.local` | `Estudiante123!` |
| Recepcionista | `recepcionista@odontopro.local` | `Recepcion123!` |
| Inventario | `inventario@odontopro.local` | `Inventario123!` |

Las contraseñas se guardan con `crypto.scryptSync` (`scrypt:salt:hash`). El login real consume `POST /api/auth/login`.

## Datos reales cargados

- 157 procedimientos
- 96 materiales únicos
- 27 asignaturas
- 5 semestres
- 921 relaciones procedimiento-material

Stock y precios arrancan en `0` porque la fuente no los contiene; se cargan desde la interfaz y se persisten en MySQL. Pacientes, citas, tratamientos e historial arrancan vacíos y se registran desde la UI.

## API principal

- `/api/catalogo/*`: catálogo real de insumos y movimientos
- `/api/auth/*`: login, registro y usuarios por rol
- `/api/clinica/*`: pacientes, citas, tratamientos, historial y actividad
- `/api/academico/*`: cursos, módulos, prácticas, insumos y pagos
- `/api/inventario/analitica/grafana`: configuración del panel de Grafana

## Grafana

El tablero `backend/grafana/dashboard_odonto_inventario.json` usa UID `odonto-inv-real` y consulta `OdontoproDB`. Las credenciales de Grafana permanecen solo en `backend/.env` y se proxyan desde el backend.
