---
layout: post
title:  "REST API Using Repository Design Pattern in ASP.NET Core"
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
These were the de-facto methods that were scaffolded by Visual Studio for me. 

I picked those three methods on purpose --- my demo will show how I will refactor those three controller actions to use the Repository design pattern.

### DBContext

My old **EmployeeDBContext** looked like this:

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
Interface signatures that return ```Task<Employee>``` or just ```Task```, as shown above, are going to be implemented asynchronously to reflect those of the existing EmployeesController, whose GetEmployee(int id) and PostEmployee() methods are also asynchronous. 

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
As you can see we declare our DBContext at the top, 

```
private readonly EmployeeDBContext _context;
```

And as you glance over the implementation of the methods, you will notice that they are, pretty much, copy-and-paste from the EmployeesController. For example, the ```FindAsync(id)``` below
```
public async Task<Employee> GetEmployeeAsync(int id)
{
    Employee employee = await _context.Employees.FindAsync(id);

    return employee;
}
```
is from the ```GetEmployee([FromRoute] int id)``` method of the existing controller.  Later on, we will remove this db context stuff completely out of the controller. 

Next, we talk about how we are going to use this new service in our application.

### Dependency Injection
Before we change our controller, we need to change our Startup program first! We need to add our **EmployeeRepository** service at start up. Open Startup.cs and look for ```ConfigureServices``` method. It will now change to this,
```
public void ConfigureServices(IServiceCollection services)
{
    services.AddDbContext<EmployeeDBContext>(options => options.UseInMemoryDatabase("Employees"));

    services.AddScoped<IEmployeeRepository, EmployeeRepository>();

    services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_2_1);
}
```

Basically, we just added this one line,
```
services.AddScoped<IEmployeeRepository, EmployeeRepository>();
```

```AddScoped``` registers the new service. There are actually 3 ways to *inject* your service --- ```AddScoped```, ```AddSingleton``` and ```AddTransient```.  Honestly, I'm still trying to wrap my head around these different methods. According to some documentations about these methods, documentation,

> Transient objects are always different; a new instance is provided to every controller and every service.

> Scoped lifetime services (AddScoped) are created once per client request (connection)... Scoped objects are the same within a request, but different across different requests

> Singleton objects are the same for every object and every request (regardless of whether an instance is provided in ConfigureServices)


I chose to use ```AddScoped``` because it seems a compromise between the other two. Transient constantly create services (albeit safer because it minimizes affecting other instances of the service). I read that Singletons are not commonly-used. Let me know what you think!

I recommend reading more about dependency injection at **[Dependency injection in ASP.NET Core][dependency-doc]** to understand it a little bit better. 

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

For the first **GET** method, I commented out the line that access the DBContext directly, and I  now call our interface implementation,

```

 return _service.GetEmployee();
//return _context.Employees;

```
For the **GET{by id}** method, I also do the same thing,
```

var employee = await _service.GetEmployeeAsync(id);
// var employee = await _context.Employees.FindAsync(id);

```
Smiliarly, for the **POST** method,
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