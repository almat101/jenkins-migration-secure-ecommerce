# Backend Architecture Cheat-Sheet: From Express to Java

Questa guida esplora i concetti fondamentali dello sviluppo backend (Routes, Hooks, MVC) attraverso quattro diversi ecosistemi: **Express**, **Fastify**, **NestJS** e **Java Spring Boot**.

---

## 1. Express.js (Minimalist / Middleware-based)

In Express, tutto è un **Middleware**. Non esistono "hook" formali; la logica scorre in una catena sequenziale di funzioni.

* **Routes:** Gestite tramite `express.Router()`.
* **Hooks:** Implementati come middleware globali o di rotta.

```javascript
// CONTROLLER (MVC)
const UserController = {
  getUser: async (req, res) => {
    const user = await UserService.findById(req.params.id);
    res.json(user);
  }
};

// ROUTES & MIDDLEWARE (HOOKS)
const router = express.Router();

// Middleware come "Hook" (pre-handler)
const authMiddleware = (req, res, next) => {
  if (!req.headers.authorization) return res.status(401).send();
  next();
};

router.get('/:id', authMiddleware, UserController.getUser);

```

---

## 2. Fastify (Plugin & Lifecycle-based)

Fastify introduce il concetto di **Lifecycle Hooks** (punti precisi nel ciclo di vita della richiesta) e **Plugins**.

* **Plugins:** Unità isolate che ricevono l'istanza del server.
* **Hooks:** Ganci specifici (es. `preHandler`, `onSend`).
* **Decorators:** Permettono di aggiungere funzionalità all'istanza di Fastify (es. `fastify.db`).

```javascript
// PLUGIN & ROUTES
export default async function userRoutes(fastify, options) {
  
  // DECORATOR (Aggiunge una utility all'istanza)
  fastify.decorate('utility', () => 'Logic');

  // HOOK (Lifecycle) - Simile a un middleware ma integrato nel ciclo
  fastify.addHook('preHandler', async (request, reply) => {
    // Logica di auth
  });

  fastify.get('/:id', async (request, reply) => {
    return { user: 'Alemmatta' };
  });
}

```

---

## 3. NestJS (Class & Decorator-based)

NestJS è un framework TypeScript fortemente influenzato da Angular e Java. Usa le **Classi** e i **Decoratori** per definire tutto.

* **Controllers:** Gestiscono le rotte.
* **Providers (Services):** Gestiscono la logica di business.
* **Guards/Interceptors:** Sostituiscono gli Hook/Middleware per sicurezza e trasformazione dati.

```typescript
// CONTROLLER
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get(':id')
  @UseGuards(AuthGuard) // "Hook" di sicurezza
  findOne(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }
}

// SERVICE
@Injectable()
export class UserService {
  getUserById(id: string) {
    return { id, name: 'Alemmatta' };
  }
}

```

---

## 4. Java Spring Boot (Enterprise / Annotation-based)

Spring Boot è lo standard Enterprise. È estremamente rigido e potente, basato sulla **Dependency Injection**.

* **Filters:** Agiscono a livello di rete (Servlet).
* **Interceptors:** Agiscono prima/dopo il Controller (l'equivalente degli Hook `preHandler`).
* **MVC Pattern:** Controller -> Service -> Repository.

```java
// REPOSITORY (Interfaccia per il DB)
public interface UserRepository extends JpaRepository<User, Long> {}

// SERVICE (Business Logic)
@Service
public class UserService {
    @Autowired
    private UserRepository repository;

    public User getUser(Long id) {
        return repository.findById(id).orElseThrow();
    }
}

// CONTROLLER (Rotte)
@RestController
@RequestMapping("/users")
public class UserController {
    @Autowired
    private UserService service;

    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(service.getUser(id));
    }
}

```

---

## 🏁 Tavola Comparativa dei Concetti

| Concetto | Express | Fastify | NestJS | Java Spring |
| --- | --- | --- | --- | --- |
| **Rotte** | Router (middleware) | Plugins | Controllers (@Get) | Controllers (@GetMapping) |
| **Hooks** | Middleware (`next()`) | Hooks (`preHandler`) | Guards / Interceptors | Interceptors / Filters |
| **DI / IoC** | Manuale | Tramite Plugins | Decoratore `@Injectable` | Annotation `@Autowired` |
| **Logica DB** | Controller o Utils | Decorators o Services | Services / Providers | Service + Repository |

---

## 💡 Glossario Fondamentale

1. **Controller:** Il "Vigile Urbano". Riceve la richiesta, valida l'input e chiama il servizio giusto. Non deve contenere logica complessa.
2. **Service:** Il "Cervello". Qui vive la logica di business (calcoli, integrazioni con Redis, invio email). È indipendente dal framework (potresti usarlo sia con Express che con Fastify).
3. **Repository:** Il "Bibliotecario". Si occupa solo di parlare con il Database (SQL, NoSQL).
4. **Middleware / Hook:** Il "Buttafuori". Controlla chi può passare (Auth), pulisce i dati o logga quello che succede prima che arrivi al Controller.
5. **Decorator / Annotation:** I "Cartellini". In Nest e Java, dicono al framework cosa deve fare con quella classe o funzione senza scrivere codice extra (es. `@Get` dice "questa è una rotta GET").

---