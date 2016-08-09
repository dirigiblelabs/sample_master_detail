# sample_master_detail

This is a template application implementing the popular [Master-Detail](https://experience.sap.com/fiori-design-web/frameworks/master-detail-app/) pattern, employing [Angular JS](https://angularjs.org/) and [Bootstrap](http://getbootstrap.com/) as front end technologies and Dirigible [JavaScript services](http://www.dirigible.io/help/scripting_services.html) and [Data Structures](http://www.dirigible.io/help/data_structures.html) for realizing the backend.

##### Master Detail pattern
In its simplest form, the data model for the Master Detail pattern is an entity set, usually presented in the front end by two views:
- 'master' view dedicated to the list itself and corresponding operations on the list 
- 'detail' view that dynamically shows the object selected in the 'master' list view and the corresponding operations on this object

##### Master Detail for Purchase Order (Header-Items)
This data model can vary depending on the complexity of the entity set objects. One popular variation, that is usually employed to realize interfaces for exploring Purchase Orders, features (master) lists composed inside the domain objects. In this case, the master domain objects (we refer to them as 'Headers') contain some basic information (e.g. the Purchase Order generic details such as Customer info, date of request, etc.) and compose an entity set of zero or more domain objects of different type (we refer to them as 'Items') that model Purchase Order line items. 

The template application is designed for this slightly more elaborate domain model:

![alt text](https://github.com/dirigiblelabs/sample_master_detail/blob/master/img/Master-Detail.png "Master-Detail Pattern Diagram")

##### Purpose
The purpose of the application is to serve as minimal, yet useful, domain-agnostic codebase, built on best practices and edge technologies, which can be adapted for particular scenarios and ultimately reduce the overall project development time.

Core functionality:
- Layout master and detail views. The application logic is designed to be layout agnostic, i.e. you can change the layout from East-Center to North-Center and it should work without too much problems.
- List master data objects (Headers) with basic information
- Attach core edit operations to the list: create new Master Object Header or delete existing one.
- Display Master Object Header details upon master list selection or deeplink request for this object. Details include the Header object data (more detailed than in the master list) and a list of the composed Object Items.
- Attached inline search by name for the selected Headers' Object Items
- Display view for No Master Object Header data
- Display application notifications dynamically (show for a period and then automatically hide or hide manually)
- Attach delete, duplicate and edit functionality on the selected Master Object Header.
- On edit of Master Object Header, attach inline-editing for Header (click to edit) and create/delete/edit of an Object Item in this Header. The changes are committed or cancelled with attached Save/Cancel functionality.

##### What is out-of-scope
While we recognize that many of the topics outlined below are a natural fit for this type of applications, our intent to keep the codebase minimal and focused on the structure and core operations has led us to the conclusion to leave them out for good. Nevertheless the applicaiton template is designed for easy integration of implementations of any of them so it is not deprived in any way of any of these functionalities. 

- Authentication and authorization.
While undeniably useful and required, the implementation is most likely scenario-specific and there are many equally good options here. We recognize this as a separate topic that should be applied on top of this template application.
- User role awareness.
The application presents full set of CRUD operations regardless of any user permissions. Handling permissions is another topic that we consider naturally integrated in this application, but not a core one, for the same reasons outlined above. Implementation options may vary greatly and it should be relatively easy to integrate one, once the choice has been made, and based on the currently logged in user roles to show or hide edit-related functionality. Of course, should you need to use the application completely in read only mode, you will mostly need to delete and reduce code.
- i18n.
Internationalization would unnecessarily complicate the code hence we voted to leave it out.

##### Technologies
Frontend
- Angular JS 1.5.7 (https://angularjs.org/) for client application framework
- Bootstrap 3.3.6 (https://getbootstrap.com/) for styling and laying out the application
- xEditable 0.2.0 (https://vitalets.github.io/x-editable/) for enabling in-line editing of the Object Header properties
- jquery-validate 1.15.0 (https://github.com/jzaefferer/jquery-validation) for form validation in the Object Item editor
- Font Awesome (http://fontawesome.io/) for scalable vector icons 

Backend
- [Dirigible JavaScript services](http://www.dirigible.io/help/scripting_services.html)
- [Dirigible Data Structures](http://www.dirigible.io/help/data_structures.html)

The JavaScript services are also (Swagger)[http://swagger.io/]-ready. Consider the project (swagger_ui)[https://github.com/dirigiblelabs/swagger_ui] to make use of it to test and further adapt the services to your scenario.
In addition, in the WebContent folder you will find two convenience user interfaces for CRUD operations on Headers and Items. You can use them e.g. to populate 

##### Limitations
Although it features some responsive components, the application is currently designed for desktop laying out the master list on the left and the details in the center-right.
