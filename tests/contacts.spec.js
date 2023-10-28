const request = require('supertest');
const express = require('express');
const { updateContact } = require('../src/controllers/contacts.js');
const { pool } = require('../src/db.js');

const app = express();
let server;


afterAll(async () => {
    await pool.end(); // Close connection to pool on end of tests
});


app.use(express.json());
app.put('/contacts/:id', updateContact);

describe('updateContact endpoint test', () => {
    it('should update a contact when valid data is provided', async () => {
        const contactId = '1'; // Replace with a valid contact ID
        const updateData = { firstName: 'Updated Name', lastName: 'updated@example.com', phoneNumber: '555-555-5555' };

        // Mock database update logic here

        const response = await request(app)
            .put(`/contacts/${contactId}`)
            .send(updateData);


        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Contact updated successfully!');
    });

    it('should return a 404 error when the contact is not found', async () => {
        const contactId = '1000'; // Replace with a non-existing contact ID
        const updateData = {
            updatedFirstName: 'Updated First Name',
            updatedLastName: 'Updated Last Name',
            updatedPhoneNumber: '555-555-5555',
        };

        const response = await request(app)
            .put(`/contacts/${contactId}`)
            .send(updateData);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Contact not found');
    });

});

