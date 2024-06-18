import { faker } from '@faker-js/faker'

const baseAppUrl = Cypress.env('baseAppUrl')

Cypress.Commands.add('logInUserViaUi', () => {
    cy.readFile('cypress/fixtures/ui.json').then(response => {
        const user = {
            user_email: response.user_email,
            user_id: response.user_id,
            user_name: response.user_name,
            user_password: response.user_password
        }        
        cy.visit(baseAppUrl + '/login')
        cy.title().should('eq', 'Notes React Application for Automation Testing Practice')
        cy.get('input[name="email"]').click().type(user.user_email)
        cy.get('input[name="password"]').click().type(user.user_password)
        //API validation can be done using intercept(). I'm not sure if it is needed here.
        cy.intercept('/notes/api/users/login').as('loginFormAndToken')
        cy.contains('button', 'Login').click()
        cy.get('input[placeholder="Search notes..."]').should('be.visible')
        cy.wait('@loginFormAndToken').then(({response}) => {
            cy.visit(baseAppUrl + '/profile')
            cy.get('[data-testid="user-email"]').should('have.value', user.user_email).should('be.visible')
            cy.get('[data-testid="user-id"]').should('have.value', user.user_id).should('be.visible')
            cy.get('[data-testid="user-name"]').should('have.value', user.user_name).should('be.visible')
            expect(response.body.message).to.eq('Login successful')
            expect(response.statusCode).to.eq(200)
            cy.writeFile('cypress/fixtures/ui.json', {
                "user_id": user.user_id,
                "user_email": user.user_email,
                "user_name": user.user_name,
                "user_password": user.user_password,
                "user_token": response.body.data.token
            })
        })
    })
})

Cypress.Commands.add('deleteUserViaUi', () =>{
    cy.visit(baseAppUrl + '/profile')
    cy.contains('button', 'Delete Account').click()
    cy.get('[data-testid="note-delete-confirm"]').click()
    cy.get('[data-testid="alert-message"]').contains('Your account has been deleted. You should create a new account to continue.').should('be.visible')
})

Cypress.Commands.add('createUserViaUi', ()=>{
    const user = {
        name: faker.person.fullName(), 
        //e-mail faker generates faker upper case e-mails. Responses present lower case e-mails. Below function will help.
        email: faker.internet.exampleEmail().toLowerCase(),
        password: faker.internet.password({ length: 8 })
    }
    cy.get('[href="/notes/app/register"]').contains('Create an account').should('be.visible').click()
    cy.title().should('eq', 'Notes React Application for Automation Testing Practice')
    cy.get('.badge').should('have.text', 'Tip').should('be.visible')
    cy.get('input[name="email"]').click().type(user.email)
    cy.get('input[name="name"]').click().type(user.name)
    cy.get('input[name="password"]').click().type(user.password)
    cy.get('input[name="confirmPassword"]').click().type(user.password)
    cy.intercept('/notes/api/users/register').as('loginForm')
    cy.contains('button', 'Register').click()
    cy.title().should('eq', 'Notes React Application for Automation Testing Practice')
    cy.contains('b', 'User account created successfully').should('be.visible')
    cy.get('[href="/notes/app/login"]').contains('Click here to Log In').should('be.visible').click()
    cy.title().should('eq', 'Notes React Application for Automation Testing Practice')
    cy.get('h1').should('have.text', 'Login').should('be.visible')
    cy.wait('@loginForm').then(({response}) => {
        expect(response.statusCode).to.eq(201)
        expect(response.body.message).to.eq('User account created successfully')
        cy.writeFile('cypress/fixtures/ui.json', {
            "user_email": user.email,
            "user_name": user.name,
            "user_password": user.password,
            "user_id": response.body.data.id
        })
    })
})

Cypress.Commands.add('deleteNoteViaUi', () =>{
    cy.contains('button', 'Delete').click()
    cy.readFile('cypress/fixtures/ui.json').then(response => {
        const note = {
            note_title: response.note_title
        }          
        cy.get('[class="modal-content"]').contains(note.note_title).click()
        cy.get('[data-testid="note-delete-confirm"]').contains('Delete').click()
    })
})

Cypress.Commands.add('createNoteViaUi', ()=>{
    //no need to read this for now but I'll let it here so later I can use it for using API requests in UI tests. Same for writing.
    cy.readFile('cypress/fixtures/ui.json').then(response => {
        const user = {   
            user_id: response.user_id,             
            user_email: response.user_email,
            user_name: response.user_name,
            user_password: response.user_password
        }
        const note = {            
            title: faker.word.words(3),
            description: faker.word.words(5),
            category: faker.helpers.arrayElement(['Home', 'Work', 'Personal']),
            completed: faker.number.int({ min: 1, max: 2 })
        }
        cy.visit(baseAppUrl)
        cy.contains('button', '+ Add Note').click()
        cy.get('[name="category"]').should('be.visible').select(note.category)        
        cy.get('[data-testid="note-completed"]').click(note.completed) 
        cy.get('input[name="title"]').click().type(note.title)
        cy.get('textarea[name="description"]').click().type(note.description)
        cy.contains('button', 'Create').click()
        cy.get('[data-testid="note-card-title"]').contains(note.title).should('be.visible')
        cy.get('[data-testid="note-card-description"]').contains(note.description).should('be.visible')
        cy.get('[data-testid="toggle-note-switch"]').should('be.checked')
        cy.get('[data-testid="note-view"]').contains('View').should('be.visible').click()
        cy.get('[data-testid="note-card-title"]').contains(note.title).should('be.visible')
        cy.get('[data-testid="note-card-description"]').contains(note.description).should('be.visible')
        cy.get('[data-testid="toggle-note-switch"]').should('be.checked')
        // Wait until we're on an note page.
        cy.location('pathname').should('match', /^\/notes\/.*$/);
        // Extract the note ID from the URL and alias it.
        cy.location('pathname').then(path => {
            // path = "/notes/api/notes/xxxxxxxxxxxxxxxxxxxxxxxxxx".
            const note_id = path.split('/')[4];
            cy.wrap(note_id).as('note_id');
            cy.log(note_id)
            cy.writeFile('cypress/fixtures/ui.json', {
                "user_id": user.user_id,
                "user_email": user.user_email,
                "user_name": user.user_name,
                "user_password": user.user_password,
                "note_id": note_id,
                "note_title": note.title,
                "note_description": note.description,
                "note_category": note.category,
                "note_completed": note.completed               
            })  
        })     
    })
})
