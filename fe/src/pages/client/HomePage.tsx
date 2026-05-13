import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import axiosClient from '../../api/axiosClient';

const HomePage = () => {
    const navigate = useNavigate();
    const [locationOptions, setLocationOptions] = useState<{ value: string, label: string }[]>([]);
    const [filter, setFilter] = useState({ origin: '', destination: '', date: '' });

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await axiosClient.get<string[]>('/trips/locations');
                const options = res.data.map(loc => ({ value: loc, label: loc }));
                setLocationOptions(options);
            } catch (err) {
                console.error("Lỗi lấy locations:", err);
            }
        };
        fetchLocations();
    }, []);

    const handleSearch = () => {
        if (!filter.origin || !filter.destination || !filter.date) {
            alert("Vui lòng chọn đầy đủ thông tin tìm kiếm!");
            return;
        }
        navigate(`/booking?origin=${filter.origin}&destination=${filter.destination}&date=${filter.date}`);
    };

    const customSelectStyles = {
        control: (base: any) => ({
            ...base,
            background: '#fff',
            color: '#000',
            width: '220px',
            cursor: 'pointer'
        }),
        option: (base: any, state: any) => ({
            ...base,
            color: state.isDisabled ? '#ccc' : '#000', // Mờ chữ khi bị disabled
            backgroundColor: state.isFocused ? '#e6f7ff' : '#fff',
            cursor: state.isDisabled ? 'not-allowed' : 'pointer', // Hiện icon cấm khi di chuột
        }),
        singleValue: (base: any) => ({ ...base, color: '#000' })
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <div style={{ color: '#fff', fontFamily: 'Arial, sans-serif' }}>
            <section style={{
                textAlign: 'center', padding: '80px 20px',
                background: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url("https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=2017") center/cover'
            }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>NHÀ XE ĐAN HỮU</h1>
                <p style={{ fontSize: '1.2rem', marginBottom: '40px' }}>Hành trình an toàn - Dịch vụ tận tâm</p>

                <div style={{
                    display: 'inline-flex', gap: '15px', alignItems: 'center',
                    background: 'rgba(255,255,255,0.1)', padding: '30px', borderRadius: '15px', backdropFilter: 'blur(10px)'
                }}>
                    {/* CHỌN ĐIỂM ĐI */}
                    <Select
                        options={locationOptions}
                        placeholder="Chọn điểm đi"
                        styles={customSelectStyles}
                        value={locationOptions.find(opt => opt.value === filter.origin) || null}
                        // Vô hiệu hóa nếu trùng với điểm đến
                        isOptionDisabled={(option) => option.value === filter.destination}
                        onChange={(opt) => setFilter({ ...filter, origin: opt?.value || '' })}
                    />

                    {/* Nút hoán đổi */}
                    <div
                        style={{ cursor: 'pointer', fontSize: '20px', userSelect: 'none' }}
                        onClick={() => setFilter({ ...filter, origin: filter.destination, destination: filter.origin })}
                        title="Đổi chiều"
                    >
                        ⇄
                    </div>

                    {/* CHỌN ĐIỂM ĐẾN */}
                    <Select
                        options={locationOptions}
                        placeholder="Chọn điểm đến"
                        styles={customSelectStyles}
                        value={locationOptions.find(opt => opt.value === filter.destination) || null}
                        // Vô hiệu hóa nếu trùng với điểm đi
                        isOptionDisabled={(option) => option.value === filter.origin}
                        onChange={(opt) => setFilter({ ...filter, destination: opt?.value || '' })}
                    />

                    <input
                        type="date"
                        // Thêm dòng này để chặn chọn ngày quá khứ
                        min={today}
                        style={{
                            padding: '10px',
                            borderRadius: '4px',
                            border: 'none',
                            width: '160px',
                            height: '38px',
                            cursor: 'pointer'
                        }}
                        // Nên gán value từ state để đồng bộ với nút Swap nếu có
                        value={filter.date}
                        onChange={(e) => setFilter({ ...filter, date: e.target.value })}
                    />

                    <button onClick={handleSearch} style={{
                        padding: '10px 30px', borderRadius: '4px', border: 'none',
                        background: '#52c41a', color: '#fff', cursor: 'pointer', fontWeight: 'bold', height: '38px'
                    }}>
                        TÌM CHUYẾN XE
                    </button>
                </div>
            </section>

            <section style={{ padding: '60px 20px', textAlign: 'center', background: '#141414' }}>
                <h2>Tại sao nên chọn chúng tôi?</h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '50px', marginTop: '40px' }}>
                    <div>
                        <h3>Chất lượng cao</h3>
                        <p>Dòng xe giường nằm đời mới nhất.</p>
                    </div>
                    <div>
                        <h3>Giá cả hợp lý</h3>
                        <p>Luôn giữ giá ổn định, kể cả lễ tết.</p>
                    </div>
                    <div>
                        <h3>Đưa đón tận nơi</h3>
                        <p>Hệ thống xe trung chuyển linh hoạt.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;