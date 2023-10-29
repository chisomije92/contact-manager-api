const request = require('supertest');
const { app } = require('../src/app.js');
const { updateContact, createContact } = require('../src/controllers/contacts.js');
const { pool } = require('../src/db.js');



let req

beforeAll(() => {
    req = {
        body: {
            firstName: "chisom", lastName: "ije", phoneNumber: '555-555-5555'
        },
    }
    pool.query = jest.fn()
    pool.query.mockResolvedValue({ rows: [req.body], rowsCount: 0 });
})


afterAll(async () => {
    await pool.end(); // Close connection to pool on end of tests
});


app.put('/contacts/:id', updateContact);
app.post('/contacts', createContact);


describe('PUT /contacts/:id', () => {
    test('should update a contact when data is provided', async () => {
        const contactId = '1';
        const response = await request(app)
            .put(`/contacts/${contactId}`)
            .send(req);


        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Contact updated successfully!');
    });

    test('should return a 404 error when the contact is not found', async () => {
        const contactId = '1000';
        pool.query.mockResolvedValue({ rows: [], rowsCount: 1 });

        const response = await request(app)
            .put(`/contacts/${contactId}`)
            .send(req);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Contact not found');
    });

});

describe('POST /contacts', () => {
    test('should create a contact', async () => {
        pool.query.mockResolvedValue({ rows: [req.body] })
        const response = await request(app).post('/contacts').send(req);
        expect(response.status).toBe(201);
        expect(response.body.message).toBe("Contact created successfully")

    });

});

