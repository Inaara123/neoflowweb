// src/components/Shuffle.js
import React, { useState, useRef, useEffect } from 'react';
import DraggableList from 'react-draggable-list';
import { ref, update } from 'firebase/database';
import { database, auth } from '../firebase';
import { useQueue } from '../QueueContext';
import './Shuffle.css'

const ConfirmationPopup = ({ isOpen, onConfirm, onCancel, message }) => {
  if (!isOpen) return null;

  return (
    <div className="confirmation-popup" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="confirmation-content" style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '5px',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <p>{message}</p>
        <button onClick={onConfirm} style={{ marginRight: '10px' }}>Yes</button>
        <button onClick={onCancel}>No</button>
      </div>
    </div>
  );
};

const ReasonModal = ({ isOpen, onSubmit, onCancel, patientName }) => {
    const [reasonText, setReasonText] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        onSubmit(reasonText);
        setReasonText('');
    };

    const handleCancel = () => {
        setReasonText('');
        onCancel();
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '5px',
                width: '400px',
                position: 'relative'
            }}>
                <button 
                    onClick={handleCancel}
                    style={{
                        position: 'absolute',
                        right: '10px',
                        top: '10px',
                        border: 'none',
                        background: 'none',
                        fontSize: '20px',
                        cursor: 'pointer'
                    }}
                >
                    ✕
                </button>
                <h3 style={{ marginBottom: '20px' }}>Add Reason for {patientName}</h3>
                <textarea
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                    style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '10px',
                        marginBottom: '20px',
                        borderRadius: '5px',
                        border: '1px solid #ccc'
                    }}
                    placeholder="Enter reason here..."
                />
                <div style={{ textAlign: 'right' }}>
                    <button 
                        onClick={handleSubmit}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#3865ad',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};

const Shuffle = () => {
    const { data, loading, error } = useQueue();
    const [items, setItems] = useState([]);
    const containerRef = useRef(null);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);

    const processPatientList = (patientList) => {
        const doctorPatients = new Map();
      
        return patientList.map((patient, index) => {
            const updatedPatient = { ...patient };
            updatedPatient.sno = (index + 1).toString();
      
            if (!doctorPatients.has(updatedPatient.docname)) {
                doctorPatients.set(updatedPatient.docname, []);
            }
            const patientsForDoctor = doctorPatients.get(updatedPatient.docname);
      
            if (patientsForDoctor.length === 0) {
                updatedPatient.waitno = 0;
            } else if (patientsForDoctor.length === 1) {
                updatedPatient.waitno = 1;
            } else {
                updatedPatient.waitno = patientsForDoctor.length;
            }
      
            patientsForDoctor.push(updatedPatient);
      
            return updatedPatient;
        });
    };

    useEffect(() => {
        if (data) {
            setItems(processPatientList(data));
        }
    }, [data]);

    function transformData(data) {
        return data.reduce((acc, item, index) => {
          const { sno, ...rest } = item;
          acc[index + 1] = {
            ...rest,
            sno: (index + 1).toString()
          };
          return acc;
        }, {});
    }

    const capitalize = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    const updateArrayAfterDeletion = (arr, snoToDelete) => {
        snoToDelete = snoToDelete.toString();
        let doctorWaitMap = new Map();
        let updatedArr = arr.filter(item => item.sno !== snoToDelete)
                            .map((item, index) => {
          item.sno = (index + 1).toString();
          if (!doctorWaitMap.has(item.docname)) {
            doctorWaitMap.set(item.docname, 0);
          }
          item.waitno = doctorWaitMap.get(item.docname);
          doctorWaitMap.set(item.docname, item.waitno + 1);
          return item;
        });
        return updatedArr;
    };

    const handleReasonSubmit = async (reasonText) => {
        if (!selectedPatient) return;
    
        // Update local state
        const updatedItems = items.map(item => {
            if (item.sno === selectedPatient.sno) {
                return { ...item, reason: reasonText };
            }
            return item;
        });
        setItems(updatedItems);
    
        // Update Firebase
        try {
            await update(ref(database, 'users/' + auth.currentUser.uid), { 
                realtime: JSON.stringify(transformData(updatedItems))
            });
        } catch (error) {
            console.log('Error updating reason in firebase database', error);
        }
    
        setIsReasonModalOpen(false);
        setSelectedPatient(null);
    };

    const TemplateItem = ({item, itemSelected, dragHandleProps}) => {
        const [isHovered, setIsHovered] = useState(false);
        const [isClicked, setIsClicked] = useState(false);
        const [isItemHovered, setIsItemHovered] = useState(false);
        const [isReasonHovered, setIsReasonHovered] = useState(false);
        const [isReasonClicked, setIsReasonClicked] = useState(false);
    
        const styles = {
            item: {
                userSelect: 'none',
                padding: '16px',
                margin: '0 0 8px 0',
                minHeight: '50px',
                width: '400px',
                marginLeft: '-100px',
                backgroundColor: itemSelected ? '#3A5A72' : '#3865ad',
                color: 'white',
                cursor: 'move',
                transition: 'all 0.3s ease',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: '25px',
                transform: isItemHovered ? 'scale(1.10)' : 'scale(1)',
                boxShadow: isItemHovered ? '0 5px 15px rgba(0,0,0,0.3)' : 'none',
                zIndex: isItemHovered ? 1 : 'auto',
            },
            leftSection: {
                flex: '1',
            },
            rightSection: {
                marginLeft: '20px',
                fontSize: '1.2em',
                fontWeight: 'bold',
            },
            name: {
                fontSize: '1.1em',
                fontWeight: 'bold',
                marginBottom: '5px',
            },
            details: {
                fontSize: '0.9em',
                opacity: '0.8',
            },
            deleteSection: {
                marginLeft: '20px',
                display: 'flex',
                gap: '10px',
                flexDirection: 'column',
                alignItems: 'flex-end',
            },
            buttonsContainer: {
                display: 'flex',
                gap: '10px',
            },
            button: {
                width: '50px',
                height: '50px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                outline: 'none',
            },
            deleteButton: {
                transform: isHovered ? 'scale(1.3)' : 'scale(1)',
            },
            reasonButton: {
                transform: isReasonHovered ? 'scale(1.3)' : 'scale(1)',
            },
            buttonImage: {
                width: '100%',
                height: '100%',
                transition: 'all 0.1s ease',
            },
            deleteImage: {
                transform: isClicked ? 'scale(1.25)' : 'scale(1)',
            },
            reasonImage: {
                transform: isReasonClicked ? 'scale(1.25)' : 'scale(1)',
            },
            reasonText: {
                fontSize: '0.9em',
                opacity: '0.8',
                fontStyle: 'italic',
                marginTop: '5px',
                textAlign: 'right',
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
            }
        };
    
        const getWaitStatus = (waitno) => {
            if (waitno === 0) return 'In Consultation';
            if (waitno === 1) return 'Next';
            return waitno.toString();
        };
    
        const handleDeleteClick = () => {
            setIsClicked(true);
            setTimeout(() => setIsClicked(false), 100);
            setItemToDelete(item);
            setIsConfirmationOpen(true);
        };

        const handleAddReasonClick = () => {
            setIsReasonClicked(true);
            setTimeout(() => setIsReasonClicked(false), 100);
            setSelectedPatient(item);
            setIsReasonModalOpen(true);
        };
    
        return (
            <div 
                className="template-item"
                style={styles.item} 
                {...dragHandleProps}
                onMouseEnter={() => setIsItemHovered(true)}
                onMouseLeave={() => setIsItemHovered(false)}
            >
                <div className="left-section" style={styles.leftSection}>
                    <div className="name" style={styles.name}>{capitalize(item.name)}</div>
                    <div className="details" style={styles.details}>{capitalize(item.docname)} | {capitalize(item.docdept)}</div>
                </div>
                <div className="right-section" style={styles.rightSection}>
                    {getWaitStatus(item.waitno)}
                </div>
                <div className="delete-section" style={styles.deleteSection}>
                    <div style={styles.buttonsContainer}>
                        <button 
                            className="reason-button"
                            style={{...styles.button, ...styles.reasonButton}}
                            onMouseEnter={() => setIsReasonHovered(true)}
                            onMouseLeave={() => setIsReasonHovered(false)}
                            onClick={handleAddReasonClick}
                        >
                            <img 
                                src="/note.png" 
                                alt="Add Reason" 
                                style={{...styles.buttonImage, ...styles.reasonImage}} 
                            />
                        </button>
                        <button 
                            className="delete-button"
                            style={{...styles.button, ...styles.deleteButton}}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            onClick={handleDeleteClick}
                        >
                            <img 
                                src="/delete.png" 
                                alt="Delete" 
                                style={{...styles.buttonImage, ...styles.deleteImage}} 
                            />
                        </button>
                    </div>
                    {item.reason && (
                        <div style={styles.reasonText}>
                            Reason: {item.reason}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        const deletedList = updateArrayAfterDeletion(items, itemToDelete.sno);
        setItems(deletedList);

        try {
            console.log("I am trying to update database and the uid is : ", auth.currentUser.uid);
            await update(ref(database, 'users/' + auth.currentUser.uid), { 
                realtime: JSON.stringify(transformData(deletedList))
            });
        } catch (error) {
            console.log('Error found while updating to firebase database', error);
        }

        setIsConfirmationOpen(false);
        setItemToDelete(null);
    };

    const handleCancelDelete = () => {
        setIsConfirmationOpen(false);
        setItemToDelete(null);
    };

    const handleCancelReason = () => {
        setIsReasonModalOpen(false);
        setSelectedPatient(null);
    };

    const _onListChange = async(newList) => {
        const finalList = (processPatientList(newList));
        setItems(finalList)
        try {
            console.log("I am trying to update database and the uid is : ", auth.currentUser.uid)
            await update(ref(database, 'users/' + auth.currentUser.uid), { realtime: JSON.stringify(transformData(finalList))})
        } catch(error) {
            console.log('error found while updating to firebase database', error)
        }
    };
    const styles = {
        container: {
            maxWidth: '300px',
            margin: '0 auto',
            padding: '20px',
            fontFamily: 'Arial, sans-serif',
        },
        list: {
            listStyleType: 'none',
            padding: 0,
        },
        emptyMessage: {
            textAlign: 'center',
            fontSize: '1.2em',
            color: '#666',
            marginTop: '20px',
        },
    };

    if (loading) {
        return <div style={styles.emptyMessage}>Loading...</div>;
    }

    if (error) {
        return <div style={styles.emptyMessage}>Error: {error}</div>;
    }

    if (!items || items.length === 0) {
        return <div style={styles.emptyMessage}>Patient List Empty</div>;
    }

    return (
        <div className="shuffle-container" style={styles.container}>
            <div ref={containerRef} className="shuffle-list" style={styles.list}>
                <DraggableList
                    itemKey="sno"
                    template={TemplateItem}
                    list={items}
                    onMoveEnd={(newList) => _onListChange(newList)}
                    container={() => containerRef.current}
                />
            </div>
            <ConfirmationPopup
                isOpen={isConfirmationOpen}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                message="Are you sure you want to delete this patient?"
            />
            <ReasonModal
                isOpen={isReasonModalOpen}
                onSubmit={handleReasonSubmit}
                onCancel={handleCancelReason}
                patientName={selectedPatient ? capitalize(selectedPatient.name) : ''}
            />
        </div>
    );
};

export default Shuffle;

