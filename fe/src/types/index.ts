export interface Trip {
    id: number;
    bus_id: number;
    origin: string;
    destination: string;
    departure_time: string;
    price: number;
}

export interface BookingRequest {
    trip_id: number;
    customer_name: string;
    customer_phone: string;
    seat_number: number;
}   