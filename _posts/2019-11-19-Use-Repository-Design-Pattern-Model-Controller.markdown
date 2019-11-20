---
layout: post
title:  "How to Use Repository Design Pattern in ASP.NET Core"
date:   2019-11-19 08:10:00 -0500
categories: dotnet core csharp
tags: rest api repository dependency injection desgin pattern
comments: true
published: true
---

When I attended the **Microsoft VSLive!&#xae;** conference in Redmond, WA in October of this year, one of the most memorable classes was one in which our instructor asked us, *"Where do people usually put the data access stuff in an MVC application?"*. And everyone says, "in the **controller**!" <!--more--> Now, whether he was asking us personally or just in general, that question stuck with me, and it made me question the past applications that I developed for my work, not just for my MVC applications but for other type of applications as well, and if I made the effort of separating the business logic from the data access layer.

Today, I am showing a demo of how to use the Repository design pattern in your application. This demo is actually a refactor of my Web API application from my **[previous post][web-api-post]**. 

## Common Practice
That old application of mine had a **Model**-**Controller** relationship, in which I passed **DBContext** directly to the Controller, as illustrated below.

### Controller

```

public class EmployeesController : ControllerBase
{
    private readonly EmployeeDBContext _context;

    public EmployeesController(EmployeeDBContext context)
    {
        _context = context;
    }
    :
    :
    
}
```

### Controller - GET and POST Methods
And in that same controller, I used that context to access my model, like this:

```
// GET: api/v1/Employees
[HttpGet]
public IEnumerable<Employee> GetEmployees()
{
    return _context.Employees;
}

// GET: api/v1/Employees/5
[HttpGet("{id}")]
public async Task<IActionResult> GetEmployee([FromRoute] int id)
{
    if (!ModelState.IsValid)
    {
        return BadRequest(ModelState);
    }

    var employee = await _context.Employees.FindAsync(id);

    if (employee == null)
    {
        return NotFound();
    }

    return Ok(employee);
}

// POST: api/v1/Employees
[HttpPost]
public async Task<IActionResult> PostEmployee([FromBody] Employee employee)
{
    if (!ModelState.IsValid)
    {
        return BadRequest(ModelState);
    }

    _context.Employees.Add(employee);
    await _context.SaveChangesAsync();

    return CreatedAtAction("GetEmployee", new { id = employee.Id }, employee);
}

```
Well, these methods were scaffolded by Visual Studio for me. Anyway, I picked those three methods on purpose --- my demo will show how I will refactor those three controller actions to use the Repository design pattern.

### DBContext

My **EmployeeDBContext** looked like this:

```

public class EmployeeDBContext : DbContext
{
    public DbSet<Employee> Employees { get; set; }

    public EmployeeDBContext(DbContextOptions<EmployeeDBContext> options)
        : base(options)
    { 
    }
}


```
As you can see, it's pretty much, what people have been doing for years, because it's what Visual Studio gives us on a silver platter, and we just use it as it is. I don't think there's anything majorly wrong with it, except that your business logic is stuck with a specific DBContext.

___
## The Repository Design Alternative

To quickly summarize, this is what I have done to refactor my Web API application to use the Repository Design Pattern.
1. Create **IEmployeeRepository** interface.
2. Create **EmployeeRepository** service that implements the interface
3. Use **Dependency Injection** in your Startup program to "add scope" to this new service.
4. Change your controller so that, instead of using **EmployeeDBContext**, it would access the model via the IEmployeeRepository interface.

### IEmployeeRepository Interface
Create an Interface called IEmployeeRepository. As I mentioned I will only implement three methods: GET, GET {by id}, and POST. So, this is how my interface would look like:

```

using System.Threading.Tasks;
:
public interface IEmployeeRepository
{
    IEnumerable<Employee> GetEmployee();

    Task<Employee> GetEmployeeAsync(int id);

    Task AddEmployeeAsync(Employee emp);
}

```
This is a very simple interface, really. The ```GetEmployee()``` interface will be used to GET all employees. The ```GetEmployee(int id)``` will be used to GET an employee based on employee id. And ```AddEmployee(Employee emp)``` will be used to create an employee in the database.

#### **Asynchronous Methods** 
Some methods like **```GetEmployeeAsync()``` and ```AddEmployeeAsync()```** are implemented asynchronously because the EmployeesController was scaffolded that way for us. For example, the **POST** method in the controller calls ```SaveChangesAsync()```, and we need to re-implement them into our interface so that they remain asynchronous. 

### EmployeeRepository Service

Create a class called EmployeeRepository. We implement the interface (above) this way:

```

using Microsoft.EntityFrameworkCore;
:
public class EmployeeRepository : IEmployeeRepository
{
    private readonly EmployeeDBContext _context;

    public EmployeeRepository(EmployeeDBContext ctx)
    {
        _context = ctx;
    }

    public IEnumerable<Employee> GetEmployee()
    {
        return _context.Employees;
    }

    public async Task<Employee> GetEmployeeAsync(int id)
    {
        Employee employee = await _context.Employees.FindAsync(id);

        return employee;
    }

    public async Task AddEmployeeAsync(Employee emp)
    {
        _context.Employees.Add(emp);
        await _context.SaveChangesAsync();
    }
}

```

#### Brief Explanation
As you can see (or might have guessed), this is where we declare our EmployeeDBContext with, 

```
private readonly EmployeeDBContext _context;
```
What goes in to this methods are, pretty much, a copy-and-paste from the EmployeesController! We even copied the async await operators in the method signature. For example, 
```
public async Task<Employee> GetEmployeeAsync(int id)
{
    Employee employee = await _context.Employees.FindAsync(id);

    return employee;
}
```
is a copycat of our controller from earlier which was,
```
public async Task<IActionResult> GetEmployee([FromRoute] int id)
{
    if (!ModelState.IsValid)
    {
        return BadRequest(ModelState);
    }

    var employee = await _context.Employees.FindAsync(id);

    if (employee == null)
    {
        return NotFound();
    }

    return Ok(employee);
}
```
except, of course, those ```if()``` statements. Next, we talk about our new implmentation of **EmployeesController**.


### Dependency Injection
Actually, before we change our controller, we need to change our Startup program first! We need to add our **EmployeeRepository** service at start up. Open Startup.cs and look for ```ConfigureServices``` method. It will now change to this,
```
public void ConfigureServices(IServiceCollection services)
{
    services.AddDbContext<EmployeeDBContext>(options => options.UseInMemoryDatabase("Employees"));

    services.AddScoped<IEmployeeRepository, EmployeeRepository>();

    services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_2_1);
}
```
The call to ```AddScoped``` basically registers your new service. In addition, there is also ```AddSingleton``` and ```AddTransient```. According to Microsoft documentation,
```
Scoped lifetime services (AddScoped) are created once per client request (connection).
``` 
and
```
Transient objects are always different; a new instance is provided to every controller and every service.

Scoped objects are the same within a request, but different across different requests

Singleton objects are the same for every object and every request (regardless of whether an instance is provided in ConfigureServices)
```

I chose to use **Scoped** because my rationale is that for my REST API application that I based this demo on, I only need **the same EmployeeRepository object** within a request, but different across different requests. Let me know what you think!

I recommend reading more about dependency injection at **[Dependency injection in ASP.NET Core][dependency-doc]** to understand it a little bit better. Honestly, I'm still trying to wrap my head around this design in ASP.NET Core.

Now, let's move on to our EmployeesContoller.

### EmployeesController
Now, that we've implemented our interface, we can now use it in our EmployeesController --- we will change it to use the Interface instead of the DBContext. So, the constructor declaration will change from

```
public class EmployeesController : ControllerBase
{
    private readonly EmployeeDBContext _context;

    public EmployeesController(EmployeeDBContext context)
    {
        _context = context;
    }
    :
    :
}
```

to this,

```
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeRepository _service;
    //private readonly EmployeeDBContext _context;

    public EmployeesController(IEmployeeRepository srv /*EmployeeDBContext context*/)
    {
        _service = srv;
        //_context = context;
    }
    :
    :
}
```
I'm **commenting out the old code** to give us a sense of what was changed. Our three methods --- **GET**, **GET{by id}**, and **POST** will now change to this,

```
// GET: api/v1/Employees
[HttpGet]
public IEnumerable<Employee> GetEmployees()
{
    return _service.GetEmployee();
    //return _context.Employees;
}

// GET: api/v1/Employees/5
[HttpGet("{id}")]
public async Task<IActionResult> GetEmployee([FromRoute] int id)
{
    if (!ModelState.IsValid)
    {
        return BadRequest(ModelState);
    }

    var employee = await _service.GetEmployeeAsync(id);
    // var employee = await _context.Employees.FindAsync(id);

    if (employee == null)
    {
        return NotFound();
    }

    return Ok(employee);
}

// POST: api/v1/Employees
[HttpPost]
public async Task<IActionResult> PostEmployee([FromBody] Employee employee)
{
    if (!ModelState.IsValid)
    {
        return BadRequest(ModelState);
    }

    await _service.AddEmployeeAsync(employee);

    //_context.Employees.Add(employee);
    //await _context.SaveChangesAsync();

    return CreatedAtAction("GetEmployee", new { id = employee.Id }, employee);
}
```

#### Brief Explanation
The changes were very simple really.

For the first **GET** method, instead of directly accessing our Employees model, we now call our interface implementation,

```
 return _service.GetEmployee();

//return _context.Employees;
```
For the **GET{by id}** method, we also do the same thing,
```
var employee = await _service.GetEmployeeAsync(id);

// var employee = await _context.Employees.FindAsync(id);
```
For the **POST** method, we also do the same thing,
```
await _service.AddEmployeeAsync(employee);

//_context.Employees.Add(employee);
//await _context.SaveChangesAsync();
```

### That's it!
That's all you need to change in your controller and model to refactor it into using the Repository design. Hope this helps you a bit with your projects!

### Source Code
Download the source code **[here][project-download]**. I also used this source code for my previous demo, specifically, my demo on **[how to use in-memory database][inmemory]** and **[how to seed your database][seed]**. 


[project-download]: https://github.com/avasay/WebAPIDepInjectIRepository

[web-api-post]: /dotnet/core/csharp/2019/11/16/dotNETCore-REST-API-InMemoryDB.html

[dependency-doc]: https://docs.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection?view=aspnetcore-3.0

[inmemory]: /dotnet/core/csharp/2019/11/16/dotNETCore-REST-API-InMemoryDB.html

[seed]: /dotnet/core/csharp/2019/11/18/How-to-Seed-Database-in-ASPNET-Core.html